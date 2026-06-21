// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Jeffery Orazulike

// Real /v1/parse integration snippets, one per language tab. Synthetic key + file only
// (AGENTS fixture rule). `lang` is a Shiki language id.
export interface CodeSample {
  lang: string
  label: string
  code: string
}

const ENDPOINT = 'https://bankstract.logickoder.dev/v1/parse'

export const HERO_CURL = `curl -X POST ${ENDPOINT} \\
  -H "Authorization: Bearer bsk_live_..." \\
  -F "pdf=@statement.pdf"`

export const CODE_SAMPLES: readonly CodeSample[] = [
  { lang: 'bash', label: 'curl', code: HERO_CURL },
  {
    lang: 'python',
    label: 'Python',
    code: `import requests

with open("statement.pdf", "rb") as pdf:
    res = requests.post(
        "${ENDPOINT}",
        headers={"Authorization": "Bearer bsk_live_..."},
        files={"pdf": pdf},
    )

data = res.json()
print(data["metadata"]["bank"], len(data["transactions"]))`,
  },
  {
    lang: 'typescript',
    label: 'TypeScript',
    code: `const form = new FormData()
form.append("pdf", file)

const res = await fetch("${ENDPOINT}", {
  method: "POST",
  headers: { Authorization: "Bearer bsk_live_..." },
  body: form,
})

const data = await res.json()
console.log(data.metadata.bank, data.transactions.length)`,
  },
  {
    lang: 'go',
    label: 'Go',
    code: `body := &bytes.Buffer{}
w := multipart.NewWriter(body)
part, _ := w.CreateFormFile("pdf", "statement.pdf")
io.Copy(part, file)
w.Close()

req, _ := http.NewRequest("POST", "${ENDPOINT}", body)
req.Header.Set("Authorization", "Bearer bsk_live_...")
req.Header.Set("Content-Type", w.FormDataContentType())
res, _ := http.DefaultClient.Do(req)`,
  },
]
