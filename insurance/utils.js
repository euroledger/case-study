// resolve and return a promise once the condition evaluates to true
const until = (conditionFunction) => {
    const poll = resolve => {
        if (conditionFunction()) {
            resolve();
        }
        else {
            setTimeout(_ => poll(resolve), 100);
        }
    }
    return new Promise(poll);
}

module.exports = {
    until: until
}
