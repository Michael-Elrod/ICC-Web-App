// floorplan-utils.ts

export const isPdf = (url: string): boolean => {
  return url.toLowerCase().endsWith(".pdf");
};

export const downloadFile = async (
  url: string,
  filename: string,
): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Error downloading file:", error);
  }
};

export const downloadAllFloorplans = async (
  floorplans: { url: string; name: string }[],
): Promise<void> => {
  for (const plan of floorplans) {
    const extension = isPdf(plan.url) ? ".pdf" : ".jpg";
    const filename = plan.name || `floorplan${extension}`;
    await downloadFile(plan.url, filename);
  }
};
