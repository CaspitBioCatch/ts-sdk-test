/**
 * Factory for creating a blob Url.
 */
export default class BlobUrlFactory {
    create(blob) {
        const url = window.URL || window.webkitURL;

        if (!url) {
            throw new Error('Unable to create BlobUrl. Neither Url nor webkitUrl are supported by the browser');
        }

        return url.createObjectURL(blob);
    }
}
