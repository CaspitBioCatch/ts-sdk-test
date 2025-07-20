export const ConfigurationDefaultValues = {
    DEFAULT_RETRY_NUM: 5,//Retry 5 times before giving up
    MIN_RETRY_NUM: 1, //Retry once
    MAX_RETRY_NUM: 1000, //Retry 1000 times before giving up

    DEFAULT_RETRY_INTERVAL: 1000,//1 second
    MIN_RETRY_INTERVAL: 100, //100 milliseconds
    MAX_RETRY_INTERVAL: 10000, //10 seconds

    DEFAULT_GROWTH_PER_FAILURE: 3500, //milliseconds
    MIN_GROWTH_PER_FAILURE: 0, //Start the growing interval from 0 milliseconds
    MAX_GROWTH_PER_FAILURE: 10000, //Increase each interval by 10 seconds

    DEFAULT_INTERVAL_LIMIT: 16000, //Don't increase retries for more than 16 seconds
    MIN_INTERVAL_LIMIT: 100,//Don't increase retries for more than 100 milliseconds
    MAX_INTERVAL_LIMIT: 300000, //Don't increase retries for more than 5 minutes

    MAX_REQUEST_DELAY: 6000,

    DEFAULT_CDS_NUM_EXPIRATION_TIME: 60, // 60 minutes
    MIN_CDS_NUM_EXPIRATION_TIME: 1, // 1 minutes
    MAX_CDS_NUM_EXPIRATION_TIME: 44640, // 44640 minutes = 1 month

    VALUE_DID_NOT_EXIST : 1,
    SUCCESS_IN_CHANGED_EXPIRATION : 0 ,
    FAILURE_IN_CHANGED_EXPIRATION: -1,
}