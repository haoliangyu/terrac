import {BlobServiceClient} from '@azure/storage-blob'

export async function exists(client: BlobServiceClient, container: string, fileName: string): Promise<boolean> {
  const containerClinet = client.getContainerClient(container)
  const blobClient = containerClinet.getBlobClient(fileName)
  return blobClient.exists()
}

export async function upload(client: BlobServiceClient, container: string, fileName: string, data: any): Promise <void> {
  const containerClient = client.getContainerClient(container)
  const blockBlobClient = await containerClient.getBlockBlobClient(fileName)
  await blockBlobClient.uploadData(Buffer.from(JSON.stringify(data)))
}

export async function purge(client: BlobServiceClient, container: string): Promise<void> {
  const containerClient = client.getContainerClient(container)

  // List all blobs in the container
  const blobs = containerClient.listBlobsFlat()

  // Delete each blob
  for await (const blob of blobs) {
    await containerClient.deleteBlob(blob.name)
  }
}

