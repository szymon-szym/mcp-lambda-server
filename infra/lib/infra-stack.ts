import * as cdk from "aws-cdk-lib";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const promptsBucket = new cdk.aws_s3.Bucket(this, "PromptsBucket", {
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    })

    const mcpHttpHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "httpHandler",
      {
        entry: "../server/main.ts",
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.minutes(3),
        handler: "run.sh",
        architecture: cdk.aws_lambda.Architecture.X86_64,
        environment: {
          AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
          RUST_LOG: "info",
          BUCKET_NAME: promptsBucket.bucketName
        },
        bundling: {
          minify: true,
          commandHooks: {
            beforeInstall: () => [],
            beforeBundling: () => [],
            afterBundling: (inputDir: string, outputDir: string) => {
              return [`cp ${inputDir}/../server/run.sh ${outputDir}`];
            },
          },
          target: "node20",
          externalModules: ["@aws-sdk/*"],
          sourceMap: true,
          forceDockerBundling: false,
        },
        layers: [
          LayerVersion.fromLayerVersionArn(
            this,
            "layer",
            `arn:aws:lambda:us-east-1:753240598075:layer:LambdaAdapterLayerX86:25`
          ),
        ],
      }
    );

    promptsBucket.grantRead(mcpHttpHandler)

    const mcpUserPool = new cdk.aws_cognito.UserPool(this, "mcpUserPool", {
      userPoolName: "mcpUserPool",
      autoVerify: {
        email: true,
      }
    });

    const mcpUserClient = new cdk.aws_cognito.UserPoolClient(this, "mcpUserClient", {
      userPool: mcpUserPool,
      userPoolClientName: "mcpUserClient",
      authFlows: {
        adminUserPassword: true,
      }
    });

    new cdk.CfnOutput(this, "userPoolId", { value: mcpUserPool.userPoolId });
    new cdk.CfnOutput(this, "userPoolClientId", { value: mcpUserClient.userPoolClientId });
    
    const mcpHttpApi = new cdk.aws_apigatewayv2.HttpApi(this, "mcpAPI", {
      defaultIntegration: new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
        "httpLambdaIntegration",
        mcpHttpHandler
      ),
      defaultAuthorizer: new cdk.aws_apigatewayv2_authorizers.HttpUserPoolAuthorizer(
        "userPoolAuthorizer",
        mcpUserPool,
        {
          userPoolClients: [mcpUserClient],
        }
      )
    })


  }

}
