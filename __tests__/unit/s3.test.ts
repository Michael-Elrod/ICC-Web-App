// s3.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class MockS3Client {
    send = mockSend;
  },
  PutObjectCommand: class MockPutObjectCommand {
    constructor(public params: any) {}
  },
  DeleteObjectCommand: class MockDeleteObjectCommand {
    constructor(public params: any) {}
  },
}));

import {
  validateFile,
  validateFiles,
  getS3Url,
  getKeyFromUrl,
  deleteFloorPlan,
  uploadFloorPlans,
} from "@/app/lib/s3";

function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("validateFile", () => {
  it("accepts valid JPEG", () => {
    const file = createMockFile("test.jpg", 1024 * 1024, "image/jpeg");
    expect(validateFile(file)).toBe(true);
  });

  it("accepts valid PNG", () => {
    const file = createMockFile("test.png", 1024, "image/png");
    expect(validateFile(file)).toBe(true);
  });

  it("accepts valid PDF", () => {
    const file = createMockFile("test.pdf", 1024, "application/pdf");
    expect(validateFile(file)).toBe(true);
  });

  it("rejects invalid file type", () => {
    const file = createMockFile("test.txt", 1024, "text/plain");
    expect(() => validateFile(file)).toThrow("Invalid file type");
  });

  it("rejects oversized file", () => {
    const file = createMockFile("big.jpg", 6 * 1024 * 1024, "image/jpeg");
    expect(() => validateFile(file)).toThrow("File size exceeds 5MB");
  });

  it("accepts file at exactly 5MB boundary", () => {
    const file = createMockFile("exact.jpg", 5 * 1024 * 1024, "image/jpeg");
    expect(validateFile(file)).toBe(true);
  });
});

describe("validateFiles", () => {
  it("returns true when all files are valid", () => {
    const files = [
      createMockFile("a.jpg", 1024, "image/jpeg"),
      createMockFile("b.png", 1024, "image/png"),
      createMockFile("c.pdf", 1024, "application/pdf"),
    ];
    expect(validateFiles(files)).toBe(true);
  });

  it("throws on the first invalid file in batch", () => {
    const files = [
      createMockFile("a.jpg", 1024, "image/jpeg"),
      createMockFile("b.txt", 1024, "text/plain"),
    ];
    expect(() => validateFiles(files)).toThrow("Invalid file type");
  });
});

describe("getS3Url", () => {
  beforeEach(() => {
    process.env.S3_BUCKET_NAME = "my-bucket";
    process.env.S3_REGION = "us-east-1";
  });

  it("builds correct URL from fileName", () => {
    const url = getS3Url("floorplans/test.jpg");
    expect(url).toBe(
      "https://my-bucket.s3.us-east-1.amazonaws.com/floorplans/test.jpg",
    );
  });
});

describe("getKeyFromUrl", () => {
  beforeEach(() => {
    process.env.S3_BUCKET_NAME = "my-bucket";
    process.env.S3_REGION = "us-east-1";
  });

  it("extracts key from full S3 URL", () => {
    const key = getKeyFromUrl(
      "https://my-bucket.s3.us-east-1.amazonaws.com/floorplans/test.jpg",
    );
    expect(key).toBe("floorplans/test.jpg");
  });
});

describe("deleteFloorPlan", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.S3_BUCKET_NAME = "my-bucket";
    process.env.S3_REGION = "us-east-1";
    process.env.S3_ACCESS_KEY_ID = "test-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret";
  });

  it("sends DeleteObjectCommand with correct params", async () => {
    mockSend.mockResolvedValueOnce({});
    await deleteFloorPlan(
      "https://my-bucket.s3.us-east-1.amazonaws.com/floorplans/test.jpg",
    );
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it("no-ops when bucket not set", async () => {
    delete process.env.S3_BUCKET_NAME;
    await deleteFloorPlan("https://example.com/test.jpg");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("no-ops when fileUrl is empty", async () => {
    await deleteFloorPlan("");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("propagates S3 errors", async () => {
    mockSend.mockRejectedValueOnce(new Error("S3 failure"));
    await expect(
      deleteFloorPlan(
        "https://my-bucket.s3.us-east-1.amazonaws.com/floorplans/test.jpg",
      ),
    ).rejects.toThrow("S3 failure");
  });
});

describe("uploadFloorPlans", () => {
  beforeEach(() => {
    mockSend.mockReset();
    process.env.S3_ACCESS_KEY_ID = "test-key";
    process.env.S3_SECRET_ACCESS_KEY = "test-secret";
    process.env.S3_REGION = "us-east-1";
    process.env.S3_BUCKET_NAME = "my-bucket";
  });

  it("throws when S3_ACCESS_KEY_ID is missing", async () => {
    delete process.env.S3_ACCESS_KEY_ID;
    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    await expect(uploadFloorPlans([file], "1")).rejects.toThrow(
      "S3_ACCESS_KEY_ID is not set",
    );
  });

  it("throws when S3_SECRET_ACCESS_KEY is missing", async () => {
    delete process.env.S3_SECRET_ACCESS_KEY;
    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    await expect(uploadFloorPlans([file], "1")).rejects.toThrow(
      "S3_SECRET_ACCESS_KEY is not set",
    );
  });

  it("uploads files and returns URLs", async () => {
    mockSend.mockResolvedValue({});
    const files = [
      createMockFile("a.jpg", 1024, "image/jpeg"),
      createMockFile("b.png", 1024, "image/png"),
    ];
    const urls = await uploadFloorPlans(files, "42");
    expect(urls).toHaveLength(2);
    expect(mockSend).toHaveBeenCalledTimes(2);
    urls.forEach((url: string) => {
      expect(url).toContain(
        "my-bucket.s3.us-east-1.amazonaws.com/floorplans/job-42-",
      );
    });
  });

  it("cleans up on partial failure", async () => {
    // First file succeeds, second file fails
    mockSend
      .mockResolvedValueOnce({}) // first PutObjectCommand succeeds
      .mockRejectedValueOnce(new Error("Upload failed")) // second PutObjectCommand fails
      .mockResolvedValue({}); // deleteFloorPlan cleanup succeeds

    const files = [
      createMockFile("a.jpg", 1024, "image/jpeg"),
      createMockFile("b.png", 1024, "image/png"),
    ];

    await expect(uploadFloorPlans(files, "1")).rejects.toThrow(
      "Failed to upload floor plans",
    );
    // Should have called send 3 times: 2 uploads + 1 cleanup delete
    expect(mockSend).toHaveBeenCalledTimes(3);
  });
});
