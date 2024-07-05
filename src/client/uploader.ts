const buttonList = document.querySelectorAll('button[data-delete-button]');
for (var i = 0; i < buttonList.length; i++) {
  const elem = buttonList[i];
  elem.addEventListener("click", function (e) {
    const button = e.target as HTMLButtonElement;
    const deleteName = button.dataset.deleteButton;
    const br = String.fromCharCode(10);
    if (deleteName && confirm("本当に削除しますか？" + br + deleteName)) {
      const xhr = new XMLHttpRequest();
      const fd = new FormData();
      xhr.open("delete", "/uploader")
      fd.append('name', deleteName);
      xhr.send(fd);
      xhr.onload = function () {
        location.reload();
      }
    }
  })
}
