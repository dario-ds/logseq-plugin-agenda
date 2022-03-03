import React, { useState } from 'react'
import { Modal, Form, Select, Input, Button, Switch } from 'antd'
import { QuestionCircleOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { genDefaultQuery, getInitalSettings, ISettingsForm, ISettingsFormQuery } from '../util/util'
import { useForm } from 'antd/lib/form/Form'
import ColorPicker from './ColorPicker'
import { CALENDAR_VIEWS } from '../util/constants'
import Query from './Query'
import CreateCalendarModal from './CreateCalendarModal'


const initialValues = getInitalSettings()
const Settings: React.FC<{
  visible: boolean
  onCancel: () => void
  onOk: (values: ISettingsForm) => void
  [key: string]: any
}> = ({ visible, onCancel, onOk, ...props }) => {
  const [settingForm] = useForm<ISettingsForm>()

  const [createCalendarModalVisible, setCreateCalendarModalVisible] = useState(false)

  console.log('[faiz:] === initialValues settings', initialValues)

  const onClickSettingSave = () => {
    settingForm.validateFields().then(values => {
      onOk(values)
    })
  }
  const onCreateCalendarModalOk = (calendarId: string) => {
    settingForm.setFieldsValue({
      calendarList: [
        ...settingForm.getFieldValue('calendarList'),
        genDefaultQuery(calendarId),
      ]
    })
    setCreateCalendarModalVisible(false)
  }

  return (
    <>
      <Modal
        {...props}
        width={700}
        destroyOnClose
        title="Calendar Setting"
        okText="Save"
        visible={visible}
        onCancel={onCancel}
        onOk={onClickSettingSave}
      >
        <Form initialValues={initialValues} labelCol={{ span: 7 }} preserve={false} form={settingForm} onValuesChange={(value) => console.log('[faiz:] === onValuesChange', value)}>
          <Form.Item label="Default View" name="defaultView" rules={[{ required: true }]}>
            <Select options={CALENDAR_VIEWS} />
          </Form.Item>
          <Form.Item label="Week Start Day" name="weekStartDay" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={0}>Sunday</Select.Option>
              <Select.Option value={1}>Monday</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Journal Date Formatter" required labelCol={{ span: 9 }}>
            <div className="flex items-center">
              <Form.Item name="journalDateFormatter" noStyle rules={[{ required: true }]} getValueFromEvent={(e) => e.target.value.trim()}><Input /></Form.Item>
              <QuestionCircleOutlined className="ml-1" onClick={() => logseq.App.openExternalLink('https://day.js.org/docs/en/display/format')} />
            </div>
          </Form.Item>
          <Form.Item label="Log Key" name="logKey" getValueFromEvent={(e) => e.target.value.trim()}>
            <Input />
          </Form.Item>
          <Form.List name="calendarList">
            {(fields, { add, remove }) => (<>
              {fields.map((field, index) => (
                <Form.Item required label={index === 0 ? 'Calendars' : ''} {...(index === 0 ? {} : { wrapperCol: {offset: 7} })}>
                  <div className="flex items-center justify-between">
                    <Form.Item name={[field.name, 'id']} noStyle rules={[{ required: true }]}>
                      <Input placeholder="Calendar ID" disabled={index === 0} style={{ width: '110px' }} />
                    </Form.Item>
                    <Form.Item name={[field.name, 'bgColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="background" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'textColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="text" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'borderColor']} noStyle rules={[{ required: true }]}>
                      <ColorPicker text="border" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'query']} noStyle rules={[{ required: true }]}>
                      <Query calendarId='query' />
                    </Form.Item>
                    <Form.Item name={[field.name, 'enabled']} noStyle valuePropName="checked">
                      <Switch size="small" />
                    </Form.Item>
                    {index !== 0 ? <MinusCircleOutlined onClick={() => {
                      console.log('[faiz:] === remove', field.name, field)
                      remove(field.name)
                    }} /> : <div style={{ width: '14px' }}></div>}
                  </div>
                </Form.Item>
              ))}
              <Form.Item wrapperCol={{ offset: 7 }}>
                <Button type="dashed" size="small" onClick={() => setCreateCalendarModalVisible(true)} block icon={<PlusOutlined />}>
                  Add Calendar
                </Button>
              </Form.Item>
            </>)}
          </Form.List>
        </Form>
        <CreateCalendarModal
          visible={createCalendarModalVisible}
          onSave={onCreateCalendarModalOk}
          onCancel={() => setCreateCalendarModalVisible(false)}
        />
      </Modal>
    </>
  )
}

export default Settings
