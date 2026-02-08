import {$} from 'zx'

const V2SwaggerUrl = 'http://be-dev.sensolist.com/api-docs/doc.json'
const V2SwaggerDir = 'src/data-provider/swagger/v2.json'

await $`curl ${V2SwaggerUrl} -o ${V2SwaggerDir}`
