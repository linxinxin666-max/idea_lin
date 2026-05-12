import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SELF_LIVE_STATE,
  DEFAULT_TALENT_LIVE_STATE,
  DEFAULT_TALENT_VIDEO_STATE,
  calculateSelfLiveSheet,
  calculateTalentLiveSheet,
  calculateTalentVideoSheet,
} from '../calculators/liveRoi'
import { LiveRoiCalculator } from './LiveRoiCalculator'

describe('LiveRoiCalculator structure', () => {
  it('uses business-facing section names and removes duplicate auto-result blocks for 自播', () => {
    const html = renderToStaticMarkup(
      <LiveRoiCalculator
        id="selfLive"
        state={DEFAULT_SELF_LIVE_STATE}
        result={calculateSelfLiveSheet(DEFAULT_SELF_LIVE_STATE)}
        onFieldChange={() => {}}
        onReset={() => {}}
      />,
    )
    const modeTwoHtml = html.slice(html.indexOf('模式二'))

    expect(html).toContain('产品基础信息设定')
    expect(html).toContain('模式一')
    expect(html).toContain('非纯佣 / 一口价')
    expect(html).toContain('模式二')
    expect(html).toContain('纯佣 / CPS')
    expect(html).toContain('非纯佣盈亏平衡 ROI')
    expect(html).toContain('纯佣利润')
    expect(html).toContain('模式对比总览')
    expect(html).toContain('live-roi-layout')
    expect(html).toContain('live-roi-main')
    expect(html).toContain('live-roi-side')
    expect(html).toContain('live-roi-primary-card')
    expect(html).toContain('live-roi-summary-card')
    expect(html).toContain('live-roi-summary-hero')
    expect(html).toContain('live-roi-notes-disclosure')
    expect(html).toContain('live-roi-mode-panels')
    expect(html).not.toContain('上半区')
    expect(html).not.toContain('下半区')
    expect(html).not.toContain('灰色自动结果')
    expect(html).not.toContain('结果总览')
    expect(html).not.toContain('live-roi-top-grid')
    expect(html).not.toContain('live-roi-summary-grid')
    expect(html).not.toContain('calc-note-chip')
    expect(modeTwoHtml).not.toContain('达人佣金')
    expect(modeTwoHtml).toContain('服务商佣金')
    expect(modeTwoHtml).toContain('其他全量抽成')
  })

  it('keeps 达播 and 达人视频 on the same cleaned structure', () => {
    const talentLiveHtml = renderToStaticMarkup(
      <LiveRoiCalculator
        id="talentLive"
        state={DEFAULT_TALENT_LIVE_STATE}
        result={calculateTalentLiveSheet(DEFAULT_TALENT_LIVE_STATE)}
        onFieldChange={() => {}}
        onReset={() => {}}
      />,
    )
    const talentVideoHtml = renderToStaticMarkup(
      <LiveRoiCalculator
        id="talentVideo"
        state={DEFAULT_TALENT_VIDEO_STATE}
        result={calculateTalentVideoSheet(DEFAULT_TALENT_VIDEO_STATE)}
        onFieldChange={() => {}}
        onReset={() => {}}
      />,
    )

    expect(talentLiveHtml).toContain('产品基础信息设定')
    expect(talentLiveHtml).toContain('模式一')
    expect(talentLiveHtml).toContain('非纯佣 / 一口价')
    expect(talentLiveHtml).toContain('模式二')
    expect(talentLiveHtml).toContain('纯佣 / CPS')
    expect(talentLiveHtml).not.toContain('灰色自动结果')
    expect(talentLiveHtml).toContain('模式对比总览')
    expect(talentLiveHtml).toContain('live-roi-layout')
    expect(talentLiveHtml).toContain('live-roi-summary-card')
    expect(talentLiveHtml).toContain('live-roi-notes-disclosure')
    expect(talentLiveHtml).not.toContain('结果总览')
    expect(talentLiveHtml).not.toContain('live-roi-summary-grid')

    expect(talentVideoHtml).toContain('产品基础信息设定')
    expect(talentVideoHtml).toContain('模式一')
    expect(talentVideoHtml).toContain('非纯佣 / 一口价')
    expect(talentVideoHtml).toContain('模式二')
    expect(talentVideoHtml).toContain('纯佣 / CPS')
    expect(talentVideoHtml).not.toContain('灰色自动结果')
    expect(talentVideoHtml).toContain('模式对比总览')
    expect(talentVideoHtml).toContain('live-roi-layout')
    expect(talentVideoHtml).toContain('live-roi-summary-card')
    expect(talentVideoHtml).toContain('live-roi-notes-disclosure')
    expect(talentVideoHtml).not.toContain('结果总览')
    expect(talentVideoHtml).not.toContain('live-roi-summary-grid')
  })
})
