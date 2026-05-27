declare module "@foundryvtt/foundryvtt-cli" {
	interface ExtractPackOptions {
		expandAdventures?: boolean;
		omitVolatile?: boolean;
		folders?: boolean;
		clean?: boolean;
		log?: boolean;
		jsonOptions?: {
			replacer?: (key: string, value: unknown) => unknown;
			space?: string | number;
		};
	}

	export function extractPack(
		inputPath: string,
		outputPath: string,
		options?: ExtractPackOptions
	): Promise<void>;
}
