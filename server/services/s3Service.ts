import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export class S3Service {
    constructor(private s3Client:  S3Client, private bucket: string) {

    }

    public async getFile(filePath: string): Promise<string> {
        
        const { Body } = await this.s3Client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: filePath
            })
        );

        const result = Body?.transformToString();

        if (!result) {
            throw new Error('File not found');
        }

        return result;
    }
}