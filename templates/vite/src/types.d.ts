declare module 'postcss-replace' {
	function PostCSSReplace(options: {
		pattern: RegExp;
		commentsOnly?: boolean;
		data: Record<string, string | number>;
	}): any;
	export default PostCSSReplace;
}