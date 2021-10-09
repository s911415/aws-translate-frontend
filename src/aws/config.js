export function credential() {
    if (window.AWS && window.AWS.config && window.AWS.config.credentials) {
        return Promise.resolve(window.AWS.config.credentials);
    }
    let cred = {
        accessKeyId: localStorage['AWS_ACCESS_KEY_ID'],
        secretAccessKey: localStorage['AWS_SECRET_ACCESS_KEY'],
    };
    if (window.AWS && window.AWS.config) {
        window.AWS.config.credentials = cred;
    }

    return Promise.resolve(cred);
}

export function region() {
    if (window.AWS && window.AWS.config && window.AWS.config.region) {
        return window.AWS.config.region;
    }

    let region = 'us-east-1';

    if (window.AWS && window.AWS.config) {
        window.AWS.config.region = region;
    }

    return region;
}
