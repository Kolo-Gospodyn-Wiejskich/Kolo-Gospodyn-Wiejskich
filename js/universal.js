function setFooterYear() {
  const year = document.querySelector('#year');
  year.innerHTML = new Date().getFullYear();
}

setFooterYear();
