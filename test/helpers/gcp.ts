import {Storage} from '@google-cloud/storage'

export async function exists(client: Storage, bucket: string, path: string): Promise<boolean> {
  const result = await client.bucket(bucket).file(path).exists()
  return result[0]
}

export async function upload(client: Storage, bucket: string, path: string, data: any): Promise <void> {
  await client
  .bucket(bucket)
  .file(path)
  .save(JSON.stringify(data))
}

export async function purge(client: Storage, bucket: string): Promise<void> {
  const [files] = await client.bucket(bucket).getFiles()

  // Delete each file in the bucket
  await Promise.all(files.map(file => file.delete()))
}

