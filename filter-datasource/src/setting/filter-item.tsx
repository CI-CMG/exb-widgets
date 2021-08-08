/** @jsx jsx */
import {
  React, jsx, ThemeVariables, Immutable, IntlShape, DataSourceManager, IMUseDataSource, IMSqlExpression,
  IMIconResult, defaultMessages as defaultMsgsCore, UseDataSource, DataSource
} from 'jimu-core'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { TextInput, TextArea, Button, Switch, PanelHeader, defaultMessages as jimuUIMessages } from 'jimu-ui'
import { DataSourceSelector, AllDataSourceTypes } from 'jimu-ui/advanced/data-source-selector'
import { SqlExpressionBuilderPopup } from 'jimu-ui/advanced/sql-expression-builder'
import { filterItemConfig } from '../config'
import defaultMessages from './translations/default'
import { getStyleForFI } from './style'
import { IconPicker } from 'jimu-ui/advanced/resource-selector'

interface Props {
  useDataSource: IMUseDataSource
  dataSource: DataSource
  intl: IntlShape
  theme: ThemeVariables
  // defaultIconResult: IMIconResult;
  onClose?: () => void
  optionChange: (prop: string, value: string | boolean | IMIconResult) => void
  dataSourceChange: (useDataSources: UseDataSource[]) => void
  onSqlExprBuilderChange: (sqlExprObj: IMSqlExpression) => void
}

interface State {
  isSqlExprShow: boolean
}

export default class FilterItem extends React.PureComponent<Props & filterItemConfig, State> {
  dsManager: DataSourceManager = window && window.jimuConfig && window.jimuConfig.isBuilder ? DataSourceManager.getInstance()
    : DataSourceManager.getInstance()

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer, AllDataSourceTypes.SceneLayer])

  constructor (props) {
    super(props)

    this.state = {
      isSqlExprShow: false,
    }
  }

  showSqlExprPopup = () => {
    this.setState({ isSqlExprShow: true })
  }

  toggleSqlExprPopup = () => {
    this.setState({ isSqlExprShow: !this.state.isSqlExprShow })
  }

  nameChange = (event) => {
    if (event && event.target && event.target.value) {
      const value = event.target.value.trim()
      this.props.optionChange('name', value)
    }
  }

  autoApplyChange = () => {
    this.props.optionChange('autoApplyWhenWidgetOpen', !this.props.autoApplyWhenWidgetOpen)
  }

  collapseChange = () => {
    this.props.optionChange('collapseFilterExprs', !this.props.collapseFilterExprs)
  }

  i18nMessage = (id: string, messages?: any) => {
    messages = messages || defaultMessages
    return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] })
  }

  render () {
    const { useDataSource, dataSource, sqlExprObj } = this.props
    const isDisabled = !dataSource
    return (
      <div className='w-100 h-100' css={getStyleForFI(this.props.theme)}>
        <div className='w-100 h-100 filter-item-panel'>
          <div className="w-100 jimu-widget-setting--header d-flex px-3 py-0">
            <PanelHeader
              level={1}
              className='py-3'
              showClose={!!this.props.onClose}
              onClose={this.props.onClose}
              title={this.i18nMessage('setFilterItem')}>
            </PanelHeader>
          </div>
          <div className='setting-container'>
            <SettingSection title={this.i18nMessage('data')} className="pt-0">
              <SettingRow>
                <DataSourceSelector
                  types={this.supportedDsTypes} disableRemove={() => true}
                  useDataSources={useDataSource && dataSource ? Immutable([useDataSource]) : Immutable([])}
                  mustUseDataSource onChange={this.props.dataSourceChange} closeDataSourceListOnChange
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title={this.i18nMessage('label', jimuUIMessages)}>
              <SettingRow>
                <TextInput
                  type='text' className='w-100' value={this.props.name ? this.props.name : ''}
                  onChange={this.nameChange}
                  aria-label={this.i18nMessage('label', jimuUIMessages)}
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title={
              <div className='w-100 d-flex justify-content-between'>
                <span className='pt-1 mr-2 line-height-1 text-truncate'>{this.props.intl.formatMessage({ id: 'icon', defaultMessage: defaultMsgsCore.icon })}</span>
                <IconPicker
                  buttonOptions={{ type: 'default', size: 'sm' }} icon={this.props.icon ? (this.props.icon as any) : null}
                  onChange={(icon) => this.props.optionChange('icon', icon)} configurableOption='none'
                />
              </div>
            }
            />

            <SettingSection title={this.i18nMessage('sqlExpr')}>
              <SettingRow label={this.i18nMessage('sqlExprDesc')} flow='wrap' />
              <SettingRow>
                <div className='d-flex justify-content-between w-100 align-items-center'>
                  <Button
                    className='w-100 text-dark set-link-btn' type={isDisabled ? 'secondary' : 'primary'} disabled={isDisabled}
                    onClick={this.showSqlExprPopup} title={this.i18nMessage('openFilterBuilder')}
                  >
                    <div className='w-100 px-2 text-truncate'>
                      {this.i18nMessage('openFilterBuilder')}
                    </div>
                  </Button>
                </div>
              </SettingRow>
              <SettingRow>
                <TextArea
                  style={{ height: '80px' }} className='w-100' spellCheck={false} placeholder={this.i18nMessage('setExprTips')}
                  value={(sqlExprObj && sqlExprObj.displaySQL) ? sqlExprObj.displaySQL : ''}
                  onClick={e => e.currentTarget.select()} readOnly
                />
              </SettingRow>
            </SettingSection>

            <SettingSection title={this.i18nMessage('options')} className='border-0'>
              <SettingRow label={this.i18nMessage('autoApplyWhenWidgetOpen')}>
                <Switch
                  checked={!!this.props.autoApplyWhenWidgetOpen}
                  onChange={this.autoApplyChange}
                  aria-label={this.i18nMessage('autoApplyWhenWidgetOpen')}
                />
              </SettingRow>
              <SettingRow label={this.i18nMessage('collapseFilterExprs')}>
                <Switch
                  checked={!!this.props.collapseFilterExprs}
                  onChange={this.collapseChange}
                  aria-label={this.i18nMessage('collapseFilterExprs')}
                  />
              </SettingRow>
            </SettingSection>

            {!isDisabled &&
              <SqlExpressionBuilderPopup
                dataSource={dataSource}
                isOpen={this.state.isSqlExprShow} toggle={this.toggleSqlExprPopup}
                expression={sqlExprObj} onChange={this.props.onSqlExprBuilderChange}
              />}
          </div>
        </div>
      </div>
    )
  }
}
