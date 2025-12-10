import { Response } from "express";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

const MOCK_STORAGE_DIR = "/tmp/mock-object-storage";

if (!fs.existsSync(MOCK_STORAGE_DIR)) {
  fs.mkdirSync(MOCK_STORAGE_DIR, { recursive: true });
}

export class MockObjectStorageService {
  constructor() {}

  getPublicObjectSearchPaths(): Array<string> {
    return [MOCK_STORAGE_DIR];
  }

  getPrivateObjectDir(): string {
    return MOCK_STORAGE_DIR;
  }

  async searchPublicObject(filePath: string): Promise<{ name: string; path: string } | null> {
    const fullPath = path.join(MOCK_STORAGE_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      return { name: filePath, path: fullPath };
    }
    return null;
  }

  async downloadObject(file: { path: string }, res: Response, cacheTtlSec: number = 3600) {
    try {
      const filePath = file.path;
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      
      const stats = fs.statSync(filePath);
      res.set({
        "Content-Type": "application/octet-stream",
        "Content-Length": stats.size.toString(),
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      });
      
      const stream = fs.createReadStream(filePath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    return `/api/mock-upload/${objectId}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<{ name: string; path: string }> {
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("Object not found");
    }
    
    const entityId = objectPath.slice("/objects/".length);
    const filePath = path.join(MOCK_STORAGE_DIR, entityId);
    
    if (!fs.existsSync(filePath)) {
      throw new Error("Object not found");
    }
    
    return { name: entityId, path: filePath };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/api/mock-upload/")) {
      const objectId = rawPath.slice("/api/mock-upload/".length);
      return `/objects/uploads/${objectId}`;
    }
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: any): Promise<string> {
    return this.normalizeObjectEntityPath(rawPath);
  }

  async canAccessObjectEntity({ userId, objectFile, requestedPermission }: any): Promise<boolean> {
    return true;
  }

  async deleteObject(objectPath: string): Promise<void> {
    try {
      if (!objectPath.startsWith("/objects/")) {
        return;
      }
      const entityId = objectPath.slice("/objects/".length);
      const filePath = path.join(MOCK_STORAGE_DIR, entityId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Mock Storage] Deleted: ${objectPath}`);
      }
    } catch (error) {
      console.error(`[Mock Storage] Error deleting:`, error);
    }
  }

  async uploadFile(objectId: string, buffer: Buffer, filename: string): Promise<string> {
    const uploadDir = path.join(MOCK_STORAGE_DIR, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, objectId);
    fs.writeFileSync(filePath, buffer);
    console.log(`[Mock Storage] Uploaded: ${filename} -> ${filePath}`);
    return `/objects/uploads/${objectId}`;
  }

  async getFileBuffer(objectPath: string): Promise<Buffer> {
    if (!objectPath.startsWith("/objects/")) {
      throw new Error("Object not found");
    }
    const entityId = objectPath.slice("/objects/".length);
    const filePath = path.join(MOCK_STORAGE_DIR, entityId);
    
    if (!fs.existsSync(filePath)) {
      throw new Error("Object not found");
    }
    
    return fs.readFileSync(filePath);
  }
}

export const mockObjectStorageService = new MockObjectStorageService();
