import { ObjectStorageService } from "./objectStorage";
import { MockObjectStorageService, mockObjectStorageService } from "./mockObjectStorage";

export type StorageServiceType = ObjectStorageService | MockObjectStorageService;

const USE_MOCK_STORAGE = process.env.MOCK_OBJECT_STORAGE === 'true' || 
                         !process.env.PRIVATE_OBJECT_DIR;

export function getObjectStorageService(): StorageServiceType {
  if (USE_MOCK_STORAGE) {
    console.log("[Storage] Using mock object storage (development mode)");
    return mockObjectStorageService;
  }
  console.log("[Storage] Using real object storage");
  return new ObjectStorageService();
}

export function isMockStorage(): boolean {
  return USE_MOCK_STORAGE;
}
