interface webManifestType {
  "name": string,
  "short_name"?: string,
  "start_url"?: string,
  "scope"?: string,
  "display"?: "fullscreen" | "standalone" | "minimal-ui" | "browser",
  "background_color"?: string,
  "description"?: string,
  "icons"?: [
    {
      "src": string,
      "sizes": string,
      "type": string
    },
  ],
  "related_applications"?: [
    {
      "platform"?: string,
      "url"?: string
    }
  ],
  "share_target": {
    "action": string,
    "method"?: "GET" | "POST",
    "enctype"?: "multipart/form-data",
    "params": {
      "title"?: string,
      "text"?: string,
      "url"?: string,
      "files"?: [
        {
          "name": "name" | string,
          "accept": string[]
        },
      ]
    }
  }
}