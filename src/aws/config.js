export function credential() {
    if (window.AWS && window.AWS.config && window.AWS.config.credentials) {
        return Promise.resolve(window.AWS.config.credentials);
    }

    if(window.AWS && window.AWS.CognitoIdentity) {
        const MAX_CNT = 20;
        let timer = 0, retryCnt = 0;
        return new Promise((resolve, error) => {
            timer = setInterval(()=>{
                if(window.AWS.config.credentials) {
                    console.log("Credential obtained");
                    clearInterval(timer);
                    resolve(window.AWS.config.credentials);
                    return;
                }
                retryCnt++;
                if(retryCnt >= MAX_CNT) {
                    clearInterval(timer);
                    error(new Error('Unable to fetch credential'));
                }
            }, 500);
        });
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
