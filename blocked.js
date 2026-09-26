chrome.runtime.sendMessage({type: "blocked"});
document.querySelector("#back").addEventListener("click", () => history.back());
applyTranslations();
