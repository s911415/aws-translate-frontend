import SupportedLang from './SupportedLanguagePairs.json';
import LangLocale from './lang';
import * as config from '../config';

const REGION = config.region();

let translateClient = null;

let isInitializing = false;

/**
 * Get translate client
 * @returns {Promise<Translate>}
 */
function getClient() {
    if (!isInitializing) {
        isInitializing = true;
        return config.credential().then(cred => {
            translateClient = new AWS.Translate();
            return translateClient;
        });
    } else {
        if (translateClient) {
            return Promise.resolve(translateClient);
        } else {
            const MAX_TRY_CNT = 30;
            let retryCnt = 0;
            let interval = 500;
            let timer;
            return new Promise((resolve, reject) => {
                timer = setInterval(() => {
                    if (translateClient) {
                        clearInterval(timer);
                        resolve(translateClient);
                    } else {
                        retryCnt++;
                        if (retryCnt >= MAX_TRY_CNT) {
                            clearInterval(timer);
                            reject(new Error('Request translate client timeout.'));
                        }
                    }
                }, interval);
            });

        }
    }
}

function listSupportedLanguagePairs() {
    return Promise.resolve(SupportedLang);
}

function localizedLanguageNames(locale = null) {
    const DefaultLocale = 'en';
    if (!locale) locale = DefaultLocale;
    if(Array.isArray(locale)) {
        for(let i = 0; i < locale.length; i++) {
            let l = locale[i].replace(/-/g, '_');
            if(LangLocale[l] !== undefined) {
                locale = l;
                break;
            }
        }
    }

    let lang = LangLocale[locale] || LangLocale[DefaultLocale];
    return Promise.resolve(lang);
}

/**
 * translateText
 * @param text
 * @param sourceLanguageCode
 * @param targetLanguageCode
 * @returns {Promise<Translate.Types.TranslateTextResponse>}
 */
function translateText(text, sourceLanguageCode, targetLanguageCode) {
    let params = {
        SourceLanguageCode: sourceLanguageCode,
        TargetLanguageCode: targetLanguageCode,
        Text: text,
    };
    return getClient().then(translateClient => {
        return new Promise((resolve, reject) => {
            translateClient.translateText(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            })
        })
    });
}

export default {listSupportedLanguagePairs, localizedLanguageNames, translateText};
