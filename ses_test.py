import boto3

ses = boto3.client('ses')

def send_test_email():
    try:
        response = ses.send_email(
            Source='michaelelrod.dev@gmail.com',  # Replace with your verified email
            Destination={'ToAddresses': ['michaelelrod.dev@gmail.com']},  # Replace with test recipient
            Message={
                'Subject': {'Data': 'Test Email'},
                'Body': {'Text': {'Data': 'This is a test email from AWS SES'}}
            }
        )
        print("Email sent! Message ID:", response['MessageId'])
    except Exception as e:
        print("Error:", str(e))

send_test_email()