import ReactMarkdown from 'react-markdown'
import React, { useMemo, useState } from 'react'
import { Octokit } from '@octokit/core'
import { throttling } from '@octokit/plugin-throttling'
import { paginateRest } from '@octokit/plugin-paginate-rest'

const pluggedClient = Octokit.plugin(throttling, paginateRest)
const ghClient = new pluggedClient({
  throttle: {
    onRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(`Rate limit hit ${options.url}`);

      if (options.request.retryCount === 0) {
        octokit.log.info(`Retry after ${retryAfter} seconds`)
        return true
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(`Abuse limit hit ${options.url}`)
    }
  }
})

const breakingReg = /breaking/i

const repoReg = "[-\\w.]+/[-\\w.]+"

type ReleasesData = {
  name: string | null
  tag_name: string
  body?: string | null
}

type DataState = 'init' | 'loading' | 'success' | 'error'

export default function App() {
  const [repo, setRepo] = useState('')
  const [data, setData] = useState<ReleasesData[] | null>(null)
  const [numberOfReleases, setNumberOfReleases] = useState(100)
  const [stopAtVersion, setStopAtVersion] = useState('')
  const [pagingLimit, setPagingLimit] = useState(10)
  const [dataState, setDataState] = React.useState<DataState>('init')

  const onSubmit = (event) => {
    event.preventDefault()
    event.stopPropagation()
    console.log('sending')
    if (!repo) return

    const doFetch = async () => {
      // webpack or formium/formik or octokit/request.js
      let currentPage = 1
      const [owner, repoName] = repo.split('/')
      const respData = await ghClient.paginate('GET /repos/{owner}/{repo}/releases', {
        owner,
        repo: repoName,
        per_page: numberOfReleases
      }, (response, done) => {
        if (response.data.find(({ name, tag_name }) => stopAtVersion && (tag_name === stopAtVersion || name === stopAtVersion))) {
          done()
        }
        else if (currentPage++ >= pagingLimit) {
          done()
        }
        return response.data
      })

      console.log('Response', respData)
      setDataState('success')
      setData(respData)
    }

    setDataState('loading')
    doFetch()
  }

  const toc = useMemo(() => {
    if (data) {
      return data.filter(release => breakingReg.test(release.body || ''))
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
            <ReactMarkdown children={release.body || ''} />
          </div>
      )
    }
    return null
  }, [data])

  return (
    <>
      <form onSubmit={onSubmit}>
        <label htmlFor='repo'>Owner/repo</label>
        <input type='text' id='repo' placeholder='owner/repo' pattern={repoReg} required onChange={event => setRepo(event.target.value)} />
        <label htmlFor='releases'>Number of releases per page</label>
        <input type='range' id='releases' min={1} max={100} value={numberOfReleases} onChange={event => setNumberOfReleases(parseInt(event.target.value, 10))} />
        {numberOfReleases}
        <label htmlFor='stopversion'>Oldest version to stop at</label>
        <input type='text' id='stopversion' onChange={event => setStopAtVersion(event.target.value)} />
        <input type='submit' />
      </form>
      <div className='toc'>
        <h2>Releases with potentially breaking changes</h2>
        <ul>
          {toc}
        </ul>
      </div>
      {dataState === 'loading' && <span>Loading...</span>}
      {cl}
    </>
  )
}