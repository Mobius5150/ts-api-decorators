export interface IAzureStorageBlobProperties {
	contentMD5: string;
	contentType: string;
	created: string;
	eTag: string;
	isIncrementalCopy: boolean;
	isServerEncrypted: boolean;
	lastModified: string;
	leaseDuration?: number;
	leaseState: number;
	leaseStatus: number;
	length: number;
}