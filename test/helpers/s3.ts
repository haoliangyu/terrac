import {S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand} from '@aws-sdk/client-s3'

export async function keyExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: key,
    MaxKeys: 1,
  })
  const listResponse: ListObjectsV2CommandOutput = await client.send(listCommand)

  return listResponse.KeyCount === 1
}

export async function putObject(client: S3Client, bucket: string, key: string, data: any): Promise <void> {
  const putCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(data),
  })

  await client.send(putCommand)
}

export async function getObject(client: S3Client, bucket: string, key: string): Promise<any> {
  const getCommand = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  const response = await client.send(getCommand) as any
  const data = await response.Body.transformToString()
  return JSON.parse(data)
}

export async function purge(client: S3Client, bucket: string): Promise<void> {
  const data = await client.send(new ListObjectsV2Command({
    Bucket: bucket,
  }))
  const items = data.Contents || []

  if (items.length === 0) {
    return
  }

  // Prepare a list of object keys to be deleted
  const deleteParams = {
    Bucket: bucket,
    Delete: {
      Objects: items.map(item => {
        return {Key: item.Key}
      }),
      Quiet: true,
    },
  }

  try {
    await client.send(new DeleteObjectsCommand(deleteParams))
  } catch (error: any) {
    // there is a bug to parse the response from this command
    if (error.$response.statusCode === 200) {
      return
    }

    throw error
  }
}
