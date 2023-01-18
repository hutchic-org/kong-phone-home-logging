import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const region = aws.config.region;
const accountId = pulumi.output(aws.getCallerIdentity()).accountId;

// Create an AWS resource (S3 Bucket)
const s3Bucket = new aws.s3.Bucket("kong-phl", {
    forceDestroy: true,
});

const role = new aws.iam.Role("kong-phl-lambda-role", {
    assumeRolePolicy: `{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }`,
});

const rolePolicy = new aws.iam.RolePolicy("kong-phl-lambda-policy", {
    role: role.name,
    policy: {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": ["logs:*"],
          "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": ["execute-api:*"],
          "Resource": "arn:aws:execute-api:*:*:*"
        },
        {
          "Effect": "Allow",
          "Action": ["s3:PutObject"],
          "Resource": pulumi.interpolate`arn:aws:s3:::${s3Bucket.bucket}/*`
        }
      ]
    },
});

const lambdaFunction = new aws.lambda.Function("kong-phl-lambda-function", {
    runtime: "python3.8",
    code: new pulumi.asset.FileArchive("./lambda"),
    handler: "lambda_function.handler",
    role: role.arn,
    environment: {
        variables: {
            "BUCKET_NAME": s3Bucket.bucket,
        },
    },
});

// Create the API Gateway
const api = new aws.apigateway.RestApi("kong-phl-api", {
    minimumCompressionSize: 0,
});

// Create a method
const method = new aws.apigateway.Method("kong-phl-method", {
    authorization: "NONE",
    httpMethod: "ANY",
    resourceId: api.rootResourceId,
    restApi: api.id,
});

// Create an integration
const integration = new aws.apigateway.Integration("kong-phl-integration", {
    httpMethod: method.httpMethod,
    resourceId: api.rootResourceId,
    restApi: api.id,
    type: "AWS_PROXY",
    integrationHttpMethod: "POST",
    uri: lambdaFunction.invokeArn,
});

const apigwLambdaPermission = new aws.lambda.Permission("kong-phl-lambda-permission", {
    action: "lambda:InvokeFunction",
    function: lambdaFunction.name,
    principal: "apigateway.amazonaws.com",
    sourceArn: pulumi.interpolate`arn:aws:execute-api:${region}:${accountId}:${api.id}/*/*/*`,
});

// Create an integration response
const integrationResponse = new aws.apigateway.IntegrationResponse("kong-phl-integration-response", {
    httpMethod: method.httpMethod,
    resourceId: api.rootResourceId,
    restApi: api.id,
    statusCode: "200",
    selectionPattern: "",
});

// Create a method response
const methodResponse = new aws.apigateway.MethodResponse("kong-phl-method-response", {
    httpMethod: method.httpMethod,
    resourceId: api.rootResourceId,
    restApi: api.id,
    statusCode: "200",
});
