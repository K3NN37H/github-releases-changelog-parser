import ReactMarkdown from 'react-markdown'
import React, { useMemo, useState } from 'react'
import { Octokit } from '@octokit/core'
import { Endpoints } from '@octokit/types'
import { throttling } from '@octokit/plugin-throttling'
import { paginateRest } from '@octokit/plugin-paginate-rest'

const pluggedClient = Octokit.plugin(throttling, paginateRest)
const ghClient = new pluggedClient({
  throttle: {
    onRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(`Rate limit hit ${options.url}`)

      if (options.request.retryCount === 0) {
        octokit.log.info(`Retry after ${retryAfter} seconds`)
        return true
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      octokit.log.warn(`Abuse limit hit ${options.url}`)
    },
  },
})

const breakingReg = /breaking/i

const repoReg = '[\\-\\w.]+/[\\-\\w.]+'

const PER_PAGE = 100

type DataState = 'init' | 'loading' | 'success' | 'error'

export default function App() {
  const [repo, setRepo] = useState('')
  const [data, setData] = useState<
    Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data'] | null
  >(null)
  const [maxNumberOfReleases, setNumberOfReleases] = useState(200)
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
      let loadedNumberOfReleases = 0
      const [owner, repoName] = repo.split('/')
      const respData = await ghClient.paginate(
        'GET /repos/{owner}/{repo}/releases',
        {
          owner,
          repo: repoName,
          per_page: PER_PAGE,
        },
        (response, done) => {
          loadedNumberOfReleases += PER_PAGE
          if (
            response.data.find(
              ({ name, tag_name }) =>
                stopAtVersion &&
                (tag_name === stopAtVersion || name === stopAtVersion)
            )
          ) {
            done()
          } else if (currentPage++ >= pagingLimit) {
            done()
          } else if (loadedNumberOfReleases >= maxNumberOfReleases) {
            done()
          }
          return response.data
        }
      )

      console.log('Response', respData)
      setDataState('success')
      setData(respData)
    }

    setDataState('loading')
    doFetch()
  }

  const toc = useMemo(() => {
    if (data) {
      return data
        .filter((release) => breakingReg.test(release.body || ''))
        .map((release) => (
          <li key={`toc-${release.tag_name}`}>
            <a href={`#${release.tag_name}`}>{release.tag_name}</a>
          </li>
        ))
    }
    return null
  }, [data])

  const cl = useMemo(() => {
    if (data) {
      return data.map((release) => (
        <div key={release.tag_name}>
          <a href={release.html_url}>
            <h1 id={release.tag_name}>{release.tag_name}</h1>
          </a>
          <span>
            {release.published_at &&
              new Date(Date.parse(release.published_at)).toString()}
          </span>
          <ReactMarkdown children={release.body || ''} />
        </div>
      ))
    }
    return null
  }, [data])

  return (
    <>
      <form onSubmit={onSubmit}>
        <label htmlFor='repo'>Owner/repo</label>
        <input
          type='text'
          id='repo'
          placeholder='owner/repo'
          pattern={repoReg}
          required
          onChange={(event) => setRepo(event.target.value)}
        />
        <label htmlFor='releases'>Max number of releases to load</label>
        <input
          type='range'
          id='releases'
          min={100}
          max={1000}
          step={100}
          value={maxNumberOfReleases}
          onChange={(event) =>
            setNumberOfReleases(parseInt(event.target.value, 10))
          }
        />
        {maxNumberOfReleases}
        <label htmlFor='stopversion'>Oldest version to stop at</label>
        <input
          type='text'
          id='stopversion'
          onChange={(event) => setStopAtVersion(event.target.value)}
        />
        <input type='submit' />
      </form>
      <div className='toc'>
        <h2>Releases with potentially breaking changes</h2>
        <ul>{toc}</ul>
      </div>
      {dataState === 'loading' && <span>Loading...</span>}
      {cl}
    </>
  )
}
