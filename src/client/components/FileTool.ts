export const fileDialog = (
  accept: string = '*',
  multiple: boolean = false
): Promise<FileList> =>
  new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = multiple
    input.accept = accept

    input.onchange = () => {
      const { files } = input
      if (files) {
        resolve(files)
      } else {
        reject(Error('Not receive the FileList'))
      }
      input.remove()
    }

    input.click()
  })
