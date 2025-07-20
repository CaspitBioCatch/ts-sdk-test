/**
 * Factory for creating a blob. Factory uses either Blob constructor or BlobBuilder to create the blob.
 */
export default class BlobFactory {
    create(codeStr) {
        const fileParts = ['(', codeStr, ')()'];

        if (window.Blob) {
            return new window.Blob(fileParts, { type: 'application/javascript' });
        }

        if (window.MSBlobBuilder) {
            const builder = new window.MSBlobBuilder();
            for (let i = 0; i < fileParts.length; i++) {
                builder.append(fileParts[i]);
            }

            return builder.getBlob('application/javascript');
        }

        throw new Error('Unable to create Blob. Neither Blob nor BlobBuilder are supported by the browser.');
    }
}
