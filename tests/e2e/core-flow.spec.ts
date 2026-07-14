import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import path from 'node:path'

const RAW_PROMPT = 'A romanticism portrait under controlled studio light'

async function readMuseDatabase(page: Page) {
  return page.evaluate(async () => new Promise<{ state: string; assetCount: number }>((resolve, reject) => {
    const request = indexedDB.open('muse-prompt-studio')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const database = request.result
      const transaction = database.transaction(['state', 'assets'], 'readonly')
      const stateRequest = transaction.objectStore('state').get('promptsmith-storage')
      const assetsRequest = transaction.objectStore('assets').count()
      transaction.oncomplete = () => resolve({ state: String(stateRequest.result ?? ''), assetCount: Number(assetsRequest.result ?? 0) })
      transaction.onerror = () => reject(transaction.error)
    }
  }))
}

async function openWorkspaceView(page: Page, testInfo: TestInfo, view: 'Home' | 'Craft' | 'Analyze' | 'Library') {
  const navName = testInfo.project.name.startsWith('mobile') ? 'Main navigation' : 'Workspace'
  await page.getByRole('navigation', { name: navName }).getByRole('button', { name: view, exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('promptsmith-storage', JSON.stringify({
      state: { contentVisibility: 'filtered', workspaceDepth: 'simple', workspaceView: 'home' },
      version: 4,
    }))
  })
})

test('crafts locally, offers related tags, saves and reopens the exact authored prompt', async ({ page }, testInfo) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url())
  })

  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Begin with the image in your head.' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Your first prompt' })).toContainText('Describe')
  await page.getByPlaceholder('Describe what you want to create or paste a prompt…').fill(RAW_PROMPT)
  await expect(page.getByLabel('Related taxonomy ingredients')).toBeVisible()
  await page.getByRole('button', { name: 'Craft prompt' }).click()

  await expect(page.getByRole('heading', { name: 'Craft' })).toBeVisible()
  await expect(page.getByLabel('Authored prompt')).toHaveValue(RAW_PROMPT)
  await page.getByRole('button', { name: /^Copy(?: output)?$/ }).click()
  await expect(page.getByText('Output copied')).toBeAttached()

  await page.getByRole('button', { name: 'Save prompt', exact: true }).click()
  await page.getByLabel('Prompt name').fill('Rain window study')
  await page.getByRole('button', { name: 'Save new prompt' }).click()

  await openWorkspaceView(page, testInfo, 'Library')
  await expect(page.getByRole('heading', { name: 'Rain window study' })).toBeVisible()
  await page.getByRole('group', { name: 'Prompt filter' }).getByRole('button', { name: /^Favorites/ }).click()
  await expect(page.getByRole('heading', { name: 'No prompts match this view.' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('article').filter({ hasText: 'Rain window study' }).getByRole('button', { name: 'Open in Craft', exact: true }).click()
  await expect(page.getByLabel('Authored prompt')).toHaveValue(RAW_PROMPT)
  await page.getByLabel('Authored prompt').fill(`${RAW_PROMPT}, closer crop`)
  await page.getByRole('button', { name: 'Update prompt', exact: true }).click()
  await expect(page.getByText('Saved version 2 to Rain window study')).toBeAttached()
  expect(externalRequests).toEqual([])
})

test('ingredient-only randomization stays visible in Simple mode', async ({ page }, testInfo) => {
  await page.goto('./')
  await openWorkspaceView(page, testInfo, 'Craft')
  await page.getByRole('button', { name: 'Studio tools', exact: true }).click()
  await page.getByRole('button', { name: 'Variations', exact: true }).click()
  await page.getByRole('button', { name: 'Randomize', exact: true }).click()
  await expect(page.getByText(/Preview · \d+ ingredients?/)).toBeVisible()
  await expect(page.getByText(/Built from \d+ ingredients?/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Apply variation', exact: true }).click()
  await page.getByRole('button', { name: 'Simple', exact: true }).click()
  await expect(page.getByText(/Built from \d+ ingredients?/)).toBeVisible()
  await expect(page.getByRole('button', { name: /^Copy(?: output)?$/ })).toBeEnabled()
})

test('variation changes ingredients without deleting authored words', async ({ page }) => {
  await page.goto('./')
  await page.getByPlaceholder('Describe what you want to create or paste a prompt…').fill(RAW_PROMPT)
  await page.getByRole('button', { name: 'Craft prompt' }).click()
  await page.getByRole('button', { name: 'More prompt actions' }).click()
  await page.getByRole('menuitem', { name: 'Create a variation' }).click()
  await expect(page.getByText('Created a light variation · Undo is available')).toBeAttached()
  await expect(page.getByLabel('Authored prompt')).toHaveValue(RAW_PROMPT)
})

test('tag discovery starts guided and keeps the complete taxonomy available', async ({ page }, testInfo) => {
  await page.goto('./')
  await openWorkspaceView(page, testInfo, 'Library')
  await page.getByRole('tab', { name: 'tags' }).click()
  await expect(page.getByRole('heading', { name: 'Find one useful direction at a time.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start with one useful direction.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Browse complete taxonomy' })).toBeVisible()
  await page.getByRole('button', { name: /^Subject/ }).click()
  await expect(page.getByText('Subject categories', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Start with one useful direction.' })).toHaveCount(0)
})

test('legacy v4 text migrates into IndexedDB without being rewritten', async ({ page }, testInfo) => {
  const legacyRaw = 'Unchanged authored text with mature terminology'
  await page.addInitScript((raw) => {
    window.localStorage.setItem('promptsmith-storage', JSON.stringify({
      state: { customText: raw, selectedTags: [], selectedModel: 'gpt-image', contentVisibility: 'filtered', workspaceDepth: 'simple', workspaceView: 'craft' },
      version: 4,
    }))
  }, legacyRaw)
  await page.goto('./')
  await openWorkspaceView(page, testInfo, 'Craft')
  await expect(page.getByLabel('Authored prompt')).toHaveValue(legacyRaw)
  const backupExists = await page.evaluate(async () => {
    const request = indexedDB.open('muse-prompt-studio')
    const db = await new Promise<IDBDatabase>((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error) })
    return await new Promise<boolean>((resolve, reject) => {
      const read = db.transaction('state').objectStore('state').get('promptsmith-storage')
      read.onsuccess = () => resolve(typeof read.result === 'string')
      read.onerror = () => reject(read.error)
    })
  })
  expect(backupExists).toBe(true)
  expect(await page.evaluate(() => localStorage.getItem('promptsmith-storage-legacy-backup') !== null)).toBe(true)
})

test('home has no serious accessibility violations', async ({ page }) => {
  await page.goto('./')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([])
})

test('workspace folios isolate drafts and reopen the previous local studio', async ({ page }) => {
  await page.goto('./')
  const authored = page.getByPlaceholder('Describe what you want to create or paste a prompt…')
  await authored.fill('Default workspace draft')
  await page.getByRole('button', { name: /Current workspace: My studio/ }).click()
  await expect(page.getByRole('heading', { name: 'Studio workspaces' })).toBeVisible()
  await page.getByLabel('Workspace name').fill('Client campaign')
  await page.getByRole('button', { name: 'Create and open' }).click()
  await expect(page.getByRole('button', { name: /Current workspace: Client campaign/ })).toBeVisible()
  await expect(authored).toHaveValue('')

  await page.getByRole('button', { name: /Current workspace: Client campaign/ }).click()
  await page.getByRole('button', { name: /^My studio Last opened/ }).click()
  await expect(page.getByRole('button', { name: /Current workspace: My studio/ })).toBeVisible()
  await expect(authored).toHaveValue('Default workspace draft')
})

test('Analyze is a first-class accessible workspace and does not transmit an upload automatically', async ({ page }, testInfo) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url())
  })
  await page.goto('./')
  await openWorkspaceView(page, testInfo, 'Analyze')
  await expect(page.getByRole('heading', { name: 'Read the image. Rebuild the direction.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Drop a reference onto the desk/ })).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([])
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: /Drop a reference onto the desk/ }).click()
  await (await chooser).setFiles(path.resolve('public/pwa-192x192.png'))
  await expect(page.getByRole('heading', { name: 'pwa-192x192' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Inspect the decisions behind the frame.' })).toBeVisible()
  await expect.poll(async () => readMuseDatabase(page)).toMatchObject({ assetCount: 2, state: expect.stringContaining('muse-asset://reference/') })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'pwa-192x192' })).toBeVisible()
  expect(externalRequests).toEqual([])
})

test('an analyzed study edits locally, changes intent, and starts a new Craft draft', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const reference = {
      id: 'study-1', name: 'glass-study.webp', dataUrl: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEALmk0mk0iIiIiIgBoSygABc6zbAAA', uploadedAt: 1,
      extractedTags: [],
      metadata: { mimeType: 'image/webp', width: 1, height: 1, originalBytes: 128, altText: 'Glass study', analysisStatus: 'analyzed', analyzedBy: { provider: 'ollama', model: 'vision', analyzedAt: 1 } },
      analysis: {
        schemaVersion: 2,
        literalDescription: 'A glass vessel rests on folded paper.',
        creativeRead: 'A restrained editorial material study.',
        selectedIntent: 'recreate',
        observations: [
          { id: 'subject', dimension: 'subject', text: 'a translucent glass vessel', evidence: 'observed', scope: 'scene', included: true },
          { id: 'lighting', dimension: 'lighting', text: 'large diffused side light', evidence: 'inferred', scope: 'direction', included: true },
        ],
        palette: [{ hex: '#E8DED0', prominence: 1, name: 'paper ivory', role: 'dominant', included: true }],
        provenance: { provider: 'ollama', model: 'vision', analyzedAt: 1 },
      },
    }
    window.localStorage.setItem('promptsmith-storage', JSON.stringify({
      state: { workspaceView: 'analyze', activeReferenceId: reference.id, referenceImages: [reference], customText: 'Previous draft' },
      version: 7,
    }))
  })
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'glass-study' })).toBeVisible()
  await page.getByRole('textbox', { name: 'lighting observation' }).fill('soft overcast window light')
  await page.getByRole('button', { name: 'Extract art direction' }).click()
  const natural = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Natural language' }) })
  await expect(natural).not.toContainText('glass vessel')
  await expect(natural).toContainText('soft overcast window light')
  await natural.getByRole('button', { name: 'Use in Craft' }).click()
  await expect(page.getByLabel('Authored prompt')).toHaveValue(/soft overcast window light/)
  await expect(page.getByLabel('Authored prompt')).not.toHaveValue(/glass vessel/)
  await expect(page.getByText('Started a new Craft draft · previous draft kept in recovery')).toBeVisible()
  await openWorkspaceView(page, testInfo, 'Library')
  await page.getByRole('tab', { name: 'references' }).click()
  await page.getByRole('button', { name: 'Open in Analyze' }).click()
  await expect(page.getByRole('heading', { name: 'glass-study' })).toBeVisible()
})

test('the installed PWA reloads offline with the current draft', async ({ page, context }) => {
  await page.goto('./')
  await page.getByPlaceholder('Describe what you want to create or paste a prompt…').fill(RAW_PROMPT)
  await page.getByRole('button', { name: 'Craft prompt' }).click()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByLabel('Authored prompt')).toHaveValue(RAW_PROMPT)
  await context.setOffline(false)
})
