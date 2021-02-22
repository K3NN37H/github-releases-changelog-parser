import ReactMarkdown from 'react-markdown'
import React, { useMemo } from 'react'

const breakingReg = /breaking/

const repoReg = "[\\w-]+\\/[\\w-]+"

type ReleasesData = {
  name: string
  tag_name: string
  body: string
}

type DataState = 'init' | 'loading' | 'success' | 'error'

export default function App() {
  const [repo, setRepo] = React.useState('')
  const [data, setData] = React.useState<ReleasesData[] | null>(null)
  const [dataState, setDataState] = React.useState<DataState>('init')

  const onSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('sending')
    if (!repo) return
    const doFetch = async () => {
      // webpack or formium/formik
      const resp = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=35`, { headers: { 'Accept': 'application/vnd.github.v3+json' } })
      const query =
`query {
  repository(owner:"webpack", name:"webpack") {
    releases(last:20) {
      edges {
        node {
          name
          tagName
          description
          descriptionHTML
        }
      }
    }
  }
}`
// const bodyContent = { query }
// const resp = await fetch(`https://api.github.com/graphql`, {
//   method: 'post',
//   body: JSON.stringify(bodyContent)
// })
      const respData = await resp.json()
      console.log('Response', respData)
      setDataState('success')
      setData(respData)
    }

    setDataState('loading')
    doFetch()
  }

  const toc = useMemo(() => {
    if (data) {
      return data.filter(release => breakingReg.test(release.body))
        .map(release =>
          <li key={`toc-${release.tag_name}`}>
            <a href={`#${release.tag_name}`}>{release.tag_name}</a>
          </li>
        )
    }
    return null
  }, [data])

  const cl = useMemo(() => {
    if (data) {
      return data.map(
        (release) =>
          <div key={release.tag_name}>
            <h1 id={release.tag_name}>{release.tag_name}</h1>
            <ReactMarkdown children={release.body} />
          </div>
      )
    }
    return null
  }, [data])

  return (
    <>
    <form onSubmit={onSubmit}>
      <label htmlFor='repo'>Owner/repo</label>
      <input type='text' id='repo' pattern={repoReg} required onChange={event => setRepo(event.target.value)} />
      <input type='submit' />
      </form>
      <ul>
        {toc}
      </ul>
      {dataState === 'loading' && <span>Loading</span>}
      {cl}
    </>
  )
}