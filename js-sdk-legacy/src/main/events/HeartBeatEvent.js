export const statusTypes = {
  Ok: 'oK',
  Error: 'Error',
};

export default class HeartBeatEvent {
    constructor(category, status) {
        this.category = category;
        this.status = status;
    }
}
