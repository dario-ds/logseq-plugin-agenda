import { useEffect, useRef, useState } from 'react'
import Calendar, { ISchedule } from 'tui-calendar'
import { Button, Modal, Select, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined, SettingOutlined, ReloadOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { format, formatISO, isSameDay, parse } from 'date-fns'
import { getSchedules, ISettingsForm, managePluginTheme } from './util/util'
import Settings from './components/Settings'
import Weekly from './components/Weekly'
import 'tui-calendar/dist/tui-calendar.css'
import './App.css'
import { CALENDAR_THEME, SHOW_DATE_FORMAT, CALENDAR_VIEWS } from './util/constants'
import ModifySchedule from './components/ModifySchedule'
import type { IScheduleValue } from './components/ModifySchedule'
import dayjs from 'dayjs'

const getDefaultOptions = () => {
  let defaultView = logseq.settings?.defaultView || 'month'
  if (logseq.settings?.defaultView === '2week') defaultView = 'month'
  return {
    defaultView,
    taskView: true,
    scheduleView: true,
    useDetailPopup: true,
    isReadOnly: false,
    disableClick: true,
    theme: CALENDAR_THEME,
    usageStatistics: false,
    week: {
      startDayOfWeek: logseq.settings?.weekStartDay || 0,
      // narrowWeekend: true,
    },
    month: {
      startDayOfWeek: logseq.settings?.weekStartDay || 0,
      scheduleFilter: (schedule: ISchedule) => {
        return Boolean(schedule.isVisible)
      },
      visibleWeeksCount: logseq.settings?.defaultView === '2week' ? 2 : undefined,
    },
    template: {
      taskTitle: () => '<span class="tui-full-calendar-left-content">Overdue</span>',
      task: (schedule: ISchedule) => '🔥' + schedule.title,
      timegridDisplayPrimayTime: function(time) {
        if (time.hour < 10) return '0' + time.hour + ':00'
        return time.hour + ':00'
      },
      popupDetailBody: (schedule: ISchedule) => {
        const calendar = `<br/><b>Calendar: ${schedule.calendarId}</b>`
        const navBtn = schedule.raw?.subscription ? '' : '<br/><a id="faiz-nav-detail" href="javascript:void(0);">Navigate To Block</a>'
        return `
          <div class="calendar-popup-detail-content">
            ${schedule.body?.split('\n').join('<br/>')}
          </div>
          ${calendar}
          ${navBtn}
        `
      },
    },
  }
}

const App: React.FC<{ env: string }> = ({ env }) => {

  const DEFAULT_OPTIONS = getDefaultOptions()

  const [isFullScreen, setIsFullScreen] = useState(false)
  const [currentView, setCurrentView] = useState(logseq.settings?.defaultView || 'month')
  const [showDate, setShowDate] = useState<string>()
  const [showExportWeekly, setShowExportWeekly] = useState<boolean>(Boolean(logseq.settings?.logKey?.enabled) && logseq.settings?.defaultView === 'week')
  const [weeklyModal, setWeeklyModal] = useState<{
    visible: boolean
    start?: string
    end?: string
  }>({ visible: false })
  const [settingModal, setSettingModal] = useState(false)
  const [modifyScheduleModal, setModifyScheduleModal] = useState<{
    visible: boolean
    type?: 'create' | 'update'
    values?: IScheduleValue
  }>({
    visible: false,
    type: 'create',
  })
  const calendarRef = useRef<Calendar>()

  const changeShowDate = () => {
    if (calendarRef.current) {
      const dateRangeStart = calendarRef.current.getDateRangeStart().getTime()
      const dateRangeEnd = calendarRef.current.getDateRangeEnd().getTime()
      if (isSameDay(dateRangeStart, dateRangeEnd)) {
        setShowDate(format(dateRangeStart, SHOW_DATE_FORMAT))
      } else {
        setShowDate(format(dateRangeStart, SHOW_DATE_FORMAT) + ' ~ ' + format(dateRangeEnd, SHOW_DATE_FORMAT))
      }
    }
  }
  const setSchedules = async () => {
    const calendar = calendarRef.current
    if (calendar) {
      calendar.clear()

      const schedules = await getSchedules()
      calendar.createSchedules(schedules)
      // calendar.createSchedules([{
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log test',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: '2022-03-14',
      //   end: '2022-03-15T00:00:00',
      //   isAllDay: true,
      //   body: 'Daily Log test detail\n123',
      //   bgColor: '#7ed3fd',
      //   color: '#222',
      //   borderColor: '#98dbfd',
      // }, {
      //   id: '1',
      //   calendarId: 'journal',
      //   title: 'Daily Log foo',
      //   category: 'time',
      //   dueDateClass: '',
      //   start: formatISO(new Date()),
      //   // isAllDay: true,
      //   body: 'Daily Log test detail\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123\n123',
      //   bgColor: '#7ed3fd',
      //   color: '#333',
      //   borderColor: '#98dbfd',
      //   // customStyle: 'opacity: 0.6;',
      // }])

      calendar.render()

    }
  }
  const exportWeekly = async () => {
    const [start, end] = showDate?.split(' ~ ') || []
    setWeeklyModal({
      visible: true,
      start,
      end,
    })
  }

  const onViewChange = (value: string) => {
    setCurrentView(value)
    if (value === '2week') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: 2,
        },
      })
    } else if(value === 'month') {
      calendarRef.current?.changeView('month')
      calendarRef.current?.setOptions({
        month: {
          visibleWeeksCount: undefined,
        },
      })
    } else {
      calendarRef.current?.changeView(value)
    }
    changeShowDate()
    setShowExportWeekly(logseq.settings?.logKey?.enabled && value === 'week')
  }
  const onClickToday = () => {
    calendarRef.current?.today()
    changeShowDate()
  }
  const onClickPrev = () => {
    calendarRef.current?.prev()
    changeShowDate()
  }
  const onClickNext = () => {
    // logseq.App.pushState('page', { uuid: '6212fe1a-0b30-4c2a-b688-b1a7db33c822' })
    // logseq.App.pushState('page', { name: '07:44 logseq-plugin-agenda' })
    // logseq.App.pushState('page', { id: 525 })
    calendarRef.current?.next()
    changeShowDate()
  }
  const onClickFullScreen = () => {
    setIsFullScreen(_isFullScreen => !_isFullScreen)
  }
  const onSettingChange = (values: ISettingsForm) => {
    logseq.updateSettings({calendarList: 1, subscriptionList: 1})
    // ensure subscription list is array
    logseq.updateSettings({subscriptionList: [], ...values})
    if (values.weekStartDay !== logseq.settings?.weekStartDay) {
      calendarRef.current?.setOptions({
        week: {
          startDayOfWeek: values.weekStartDay,
        },
        month: {
          startDayOfWeek: values.weekStartDay,
        },
      })
    }
    setShowExportWeekly(Boolean(values.logKey?.enabled) && currentView === 'week')
    // if (values.logKey !== logseq.settings?.logKey) setSchedules()

    // exec after 500ms to make sure the settings are updated
    setTimeout(() => {
      managePluginTheme()
      setSchedules()
    }, 500)
    setSettingModal(false)
  }
  const onClickShowDate = async () => {
    if (currentView === 'day' && showDate) {
      const { preferredDateFormat } = await logseq.App.getUserConfigs()
      const date = format(parse(showDate, SHOW_DATE_FORMAT, new Date()), preferredDateFormat)
      logseq.App.pushState('page', { name: date })
      logseq.hideMainUI()
    }
  }

  useEffect(() => {
    managePluginTheme()
    // Delay execution to avoid the TUI not being able to acquire the height correctly
    // The bug manifests as the weekly view cannot auto scroll to the current time
    setTimeout(() => {
      calendarRef.current = new Calendar('#calendar', {
        ...DEFAULT_OPTIONS,
        // template: {
        //   // monthDayname: function(dayname) {
        //   //   return '<span class="calendar-week-dayname-name">' + dayname.label + '</span>';
        //   // }
        // }
      })
      changeShowDate()
      setSchedules()
      calendarRef.current.on('clickDayname', function(event) {
        const calendar = calendarRef.current
        if (calendar?.getViewName() === 'week') {
          calendar.setDate(new Date(event.date))
          calendar.changeView('day', true)
          changeShowDate()
          setCurrentView('day')
        }
      })
      calendarRef.current.on('clickSchedule', function(info) {
        document.querySelector('#faiz-nav-detail')?.addEventListener('click', async (e) => {
          const rawData = info.schedule.raw || {}
          const { id: pageId, originalName } = rawData?.page || {}
          let pageName = originalName
          // datascriptQuery 查询出的 block, 没有详细的 page 属性, 需要手动查询
          if (!pageName) {
            const page = await logseq.Editor.getPage(pageId)
            pageName = page?.originalName
          }
          const { uuid: blockUuid } = await logseq.Editor.getBlock(rawData.id) || { uuid: '' }
          logseq.Editor.scrollToBlockInPage(pageName, blockUuid)
          logseq.hideMainUI()
        }, { once: true })
      })
      calendarRef.current.on('beforeCreateSchedule', function(event) {
        console.log('[faiz:] === beforeCreateSchedule', event, typeof event.start, dayjs(event.start))
        setModifyScheduleModal({
          visible: true,
          type: 'create',
          values: {
            start: dayjs(event.start),
            end: dayjs(event.end),
            isAllDay: event.triggerEventName === 'dblclick',
          }
        })
        calendarRef.current?.render()
      })
      calendarRef.current.on('beforeUpdateSchedule', function(event) {
        console.log('[faiz:] === beforeUpdateSchedule', event)
        const { schedule } = event
        setModifyScheduleModal({
          visible: true,
          type: 'update',
          values: {
            id: schedule.id,
            start: dayjs(schedule.start),
            end: dayjs(schedule.end),
            isAllDay: schedule.isAllDay,
            calendarId: schedule.calendarId,
            title: schedule.raw?.content?.split('\n')[0],
            raw: schedule.raw,
          },
        })
      })
      calendarRef.current.on('beforeDeleteSchedule', function(event) {
        console.log('[faiz:] === beforeDeleteSchedule', event)
        const { schedule } = event
        Modal.confirm({
          title: 'Are you sure delete this schedule?',
          content: <div className="whitespace-pre-line">{schedule.raw?.content}</div>,
          onOk: async () => {
            const block = await logseq.Editor.getBlock(schedule.raw?.id)
            if (!block) return logseq.App.showMsg('Block not found', 'error')
            logseq.Editor.removeBlock(block?.uuid)
            setSchedules()
          },
        })
      })
    }, 0)
  }, [])

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="mask w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-50" onClick={() => logseq.hideMainUI()}></div>
      <div className={`${isFullScreen ? 'w-full h-full' : 'w-5/6'} flex flex-col justify-center overflow-hidden bg-white relative rounded text-black p-3`} style={{ maxWidth: isFullScreen ? 'none' : '1200px' }}>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <Select
              value={currentView}
              defaultValue={DEFAULT_OPTIONS.defaultView}
              onChange={onViewChange}
              options={CALENDAR_VIEWS}
              style={{ width: '100px' }}
            />

            <Button className="ml-4" shape="round" onClick={onClickToday}>Today</Button>

            <Button className="ml-4" shape="circle" icon={<LeftOutlined />} onClick={onClickPrev}></Button>
            <Button className="ml-1" shape="circle" icon={<RightOutlined />} onClick={onClickNext}></Button>

            <Tooltip title={ currentView === 'day' ? 'Navigate to this journal note' : '' }>
              <span
                className={`ml-4 text-xl h-full items-center inline-block ${currentView === 'day' ? 'cursor-pointer' : 'cursor-auto'}`}
                style={{ height: '34px', lineHeight: '34px' }}
                onClick={onClickShowDate}
              >
                { showDate }
              </span>
            </Tooltip>
          </div>

          <div>
            { showExportWeekly && <Button className="mr-4" onClick={exportWeekly}>Export Weekly</Button> }
            <Button className="mr-4" onClick={setSchedules} type="primary" icon={<ReloadOutlined />}>Reload</Button>
            <Button className="mr-4" onClick={() => setSettingModal(true)} shape="circle" icon={<SettingOutlined />}></Button>
            <Button onClick={onClickFullScreen} shape="circle" icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}></Button>
          </div>
        </div>
        <div id="calendar"></div>
        <Weekly
          visible={weeklyModal.visible}
          start={weeklyModal.start}
          end={weeklyModal.end}
          onCancel={() => setWeeklyModal({ visible: false })}
        />
        <Settings
          visible={settingModal}
          onCancel={() => setSettingModal(false)}
          onOk={onSettingChange}
        />
        {
          modifyScheduleModal.visible
          ? <ModifySchedule
            visible={modifyScheduleModal.visible}
            type={modifyScheduleModal.type}
            initialValues={modifyScheduleModal.values}
            onCancel={() => setModifyScheduleModal({ visible: false })}
            onSave={() => {
              setModifyScheduleModal({ visible: false })
              setSchedules()
            }}
          />
          : null
        }
      </div>
    </div>
  )
}

export default App
