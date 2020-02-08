import { IBinding } from "../../../generators/Bindings/Bindings";
import { AzFuncBinding } from "../../../metadata/AzFuncBindings";

export interface IBlobTriggerBinding extends IBinding {
	type: AzFuncBinding.BlobTrigger;
	direction: 'in';
	name: 'blobTrigger';
	path: string;
	connection?: string;
}

export interface IBlobInputBinding extends IBinding {
	type: AzFuncBinding.Blob;
	direction: 'in';
	name: string;
	path: string;
	connection?: string;
}

export interface IBlobOutputBinding extends IBinding {
	type: AzFuncBinding.Blob;
	direction: 'out';
	name: string;
	path: string;
	connection?: string;
}