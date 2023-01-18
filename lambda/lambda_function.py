# -*- coding: utf-8 -*-
import json, os, time
import boto3


def handler(event, context):
    s3 = boto3.client("s3")

    # Log to s3
    s3.put_object(
        Bucket=os.environ["BUCKET_NAME"],
        Key="packets/" + str(time.time()) + ".json",
        Body=json.dumps(json.loads(event["body"])),
    )

    return {"statusCode": 200}
