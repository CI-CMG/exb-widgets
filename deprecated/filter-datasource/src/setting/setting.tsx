/** @jsx jsx */
import {
  React, jsx, DataSourceManager, Immutable, UseDataSource, ImmutableObject, IMSqlExpression,
  IMIconResult, ClauseLogic, urlUtils, defaultMessages as jimuCoreMessages, DataSource
} from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingSection, SettingRow, SidePopper } from 'jimu-ui/advanced/setting-components'
import FilterItem from './filter-item'
import { Button, Icon, ButtonGroup, Switch, Tooltip, Label, defaultMessages as jimuUIMessages, Checkbox, Alert } from 'jimu-ui'
import { WidgetConfig, filterItemConfig, FilterArrangeType, FilterTriggerType } from '../config'
import defaultMessages from './translations/default'
import { getStyleForWidget } from './style'
import { getJimuFieldNamesBySqlExpression } from 'jimu-ui/basic/sql-expression-runtime'
import FilterItemDataSource from './filter-item-ds'
import { List, TreeItemActionType, TreeItemType } from 'jimu-ui/basic/list-tree'

const IconNoData = require('jimu-ui/lib/icons/click-outlined-48.svg')
const IconClose = require('jimu-ui/lib/icons/close.svg')
const IconAdd = require('jimu-ui/lib/icons/add-16.svg')
const FilterIcon = require('jimu-ui/lib/icons/filter-16.svg')
const WarningIcon = require('jimu-ui/lib/icons/info-16.svg')

const DefaultIconResult: IMIconResult = Immutable({
  svg: FilterIcon,
  properties: {
    color: '',
    filename: 'filter-16.svg',
    originalName: 'filter-16.svg',
    inlineSvg: true,
    path: ['general', 'filter'],
    size: 14
  }
})

interface State {
  showFilterItemPanel: boolean
  refreshFilterItemPanel: boolean
  dataSources: { [dsId: string]: DataSource }
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<WidgetConfig> & State, any> {
  index: number
  dsHash: {[index: number]: ImmutableObject<UseDataSource>}
  dsManager: DataSourceManager
  sidePopperTrigger = React.createRef<HTMLDivElement>()

  constructor (props) {
    super(props)
    this.index = 0
    this.dsManager = DataSourceManager.getInstance()
    this.state = {
      showFilterItemPanel: false,
      refreshFilterItemPanel: false,
      dataSources: {}
    }
  }
  // optionsContainerStyle : any = {position: 'absolute', bottom: '0', height: 'auto'};

  /** ********** For widget ***********/
  i18nMessage = (id: string, messages?: any, values?: any) => {
    messages = messages || defaultMessages
    return this.props.intl.formatMessage({ id: id, defaultMessage: messages[id] }, values)
  }

  toggleTimeout: NodeJS.Timer
  onShowFilterItemPanel = (index?: number) => {
    if (index === this.index) {
      this.setState({
        showFilterItemPanel: !this.state.showFilterItemPanel
      })
    } else {
      this.setState({
        showFilterItemPanel: true
      })
      this.setState({
        refreshFilterItemPanel: !this.state.refreshFilterItemPanel
      })
      this.index = index
    }
  }

  onCloseFilterItemPanel = () => {
    this.setState({
      showFilterItemPanel: false
    })
    this.index = 0
  }

  updateConfigForOptions = (prop: string, value: boolean | ClauseLogic | FilterArrangeType | FilterTriggerType) => {
    const config = {
      id: this.props.id,
      config: this.props.config.set(prop, value)
    }
    this.props.onSettingChange(config)
  }

  /** ********** For Filter Item config ***********/
  removeFilterItem = (index: number) => {
    if (this.index === index) {
      this.onCloseFilterItemPanel()
    }
    const delUseDsId = this.props.config.filterItems[index].useDataSource.dataSourceId
    // del current filter item
    const _fis = this.props.config.filterItems.asMutable({ deep: true })
    _fis.splice(index, 1)
    const fis = this.props.config.set('filterItems', _fis)

    const config = {
      id: this.props.id,
      config: fis
    } as any

    const useDSs = this.getUseDataSourcesByRemoved(_fis, delUseDsId)
    if (useDSs) {
      config.useDataSources = useDSs
    }

    this.props.onSettingChange(config)

    if (this.index > index) {
      this.index--
    }
  }

  optionChangeForFI = (prop: string, value: string | boolean | IMIconResult) => {
    const currentFI = this.props.config.filterItems[this.index]
    if (currentFI) {
      const fItems = this.props.config.filterItems.asMutable({ deep: true })
      const fItem = Immutable(fItems[this.index]).set(prop, value)
      fItems.splice(this.index, 1, fItem.asMutable({ deep: true }))

      const config = {
        id: this.props.id,
        config: this.props.config.set('filterItems', fItems)
      }
      this.props.onSettingChange(config)
    }
  }

  optionChangeByDrag = (fItems) => {
    const config = {
      id: this.props.id,
      config: this.props.config.set('filterItems', fItems)
    }
    this.props.onSettingChange(config)
  }

  // save currentSelectedDs to array;
  dataSourceChangeForFI = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) {
      return
    }
    const currentIMUseDs = Immutable(useDataSources[0])
    this.dsManager.createDataSourceByUseDataSource(Immutable(useDataSources[0])).then(currentDs => {
      const filterItem: filterItemConfig = {
        icon: DefaultIconResult,
        name: currentDs.getLabel(),
        useDataSource: currentIMUseDs,
        sqlExprObj: null,
        autoApplyWhenWidgetOpen: false,
        collapseFilterExprs: false
      }

      const currentFI = this.props.config.filterItems[this.index]
      let filterItems
      if (currentFI) { // update FI, reset other opts for current FI
        const _fis = this.props.config.filterItems.asMutable({ deep: true })
        _fis.splice(this.index, 1, filterItem)
        filterItems = Immutable(_fis)
      } else { // add new FI to FIs
        filterItems = this.props.config.filterItems.concat(Immutable([Immutable(filterItem)]))
      }

      const config = {
        id: this.props.id,
        config: this.props.config.set('filterItems', filterItems)
      } as any

      const useDSs = this.getUseDataSourcesByDsAdded(useDataSources[0], currentFI?.useDataSource.dataSourceId)
      if (useDSs) {
        config.useDataSources = useDSs
      }

      this.props.onSettingChange(config)
    })
  }

  sqlExprBuilderChange = (sqlExprObj: IMSqlExpression) => {
    let fields = []
    if (sqlExprObj?.parts?.length > 0) {
      fields = getJimuFieldNamesBySqlExpression(sqlExprObj) // get fields
    } else {
      sqlExprObj = null // when no valid clauses in builder
    }
    const currentUseDs = this.props.config.filterItems[this.index].useDataSource
    const updatedDs: UseDataSource = {
      dataSourceId: currentUseDs.dataSourceId,
      mainDataSourceId: currentUseDs.mainDataSourceId,
      dataViewId: currentUseDs.dataViewId,
      rootDataSourceId: currentUseDs.rootDataSourceId,
      fields: fields
    }

    // update sqlExprObj, sqlExprObj and ds
    const fItems = this.props.config.filterItems.asMutable({ deep: true })
    const fItem = Object.assign({}, fItems[this.index], { sqlExprObj: sqlExprObj, useDataSource: updatedDs })
    fItems.splice(this.index, 1, fItem)

    const config = {
      id: this.props.id,
      config: this.props.config.set('filterItems', Immutable(fItems))
    } as any

    const useDSs = this.getUseDataSourcesByFieldsChanged(fItems, updatedDs.dataSourceId)
    if (useDSs) {
      config.useDataSources = useDSs
    }

    this.props.onSettingChange(config)
  }

  // Get all concated fields of current ds
  getAllUsedFieldsByDataSourceId = (fItems: filterItemConfig[], dataSourceId: string): string[] => {
    let fields = []
    fItems.map(item => {
      if (item.useDataSource.dataSourceId === dataSourceId && item.useDataSource.fields) {
        fields = fields.concat(item.useDataSource.fields)
      }
    })
    fields = Array.from(new Set(fields)).sort()
    return fields
  }

  // Update fields for current useDataSource
  getUpdatedUseDsArray = (fields: string[], dataSourceId: string): UseDataSource[] => {
    const usdDSs = []
    this.props.useDataSources.map(useDs => {
      if (useDs.dataSourceId === dataSourceId) {
        usdDSs.push(useDs.set('fields', fields))
      } else {
        usdDSs.push(useDs)
      }
    })
    return usdDSs
  }

  getUseDataSourcesByRemoved = (fItems: filterItemConfig[], dataSourceId: string) => {
    // Check if multiple filter items share the same useDs.
    const isInNewFilters = fItems.filter(item => dataSourceId === item.useDataSource.dataSourceId).length > 0
    if (isInNewFilters) {
      return this.getUseDataSourcesByFieldsChanged(fItems, dataSourceId)
    } else { // Remove useDs
      return this.props.useDataSources.asMutable({ deep: true }).filter(useDs => useDs.dataSourceId !== dataSourceId)
    }
  }

  // Concat all fields of current ds, and update them for current useDataSource.
  getUseDataSourcesByFieldsChanged = (fItems: filterItemConfig[], dataSourceId: string) => {
    const fields = this.getAllUsedFieldsByDataSourceId(fItems, dataSourceId)
    // useDs could be undefined when ds is invalid.
    const previousFields = this.props.useDataSources.filter(useDs => dataSourceId === useDs.dataSourceId)[0]?.fields?.asMutable({ deep: true }) || []
    const isFieldsChanged = JSON.stringify(fields) !== JSON.stringify(previousFields) // Compare sorted fields
    return isFieldsChanged ? this.getUpdatedUseDsArray(fields, dataSourceId) : null
  }

  // Save new useDs to props.useDataSource if it's not existed.
  getUseDataSourcesByDsAdded = (useDataSource: UseDataSource, previousDsId?: string): UseDataSource[] => {
    let useDSs = this.props.useDataSources?.asMutable({ deep: true }) || []

    //remove previous ds when it's the only filter that consumes this data source.
    if (previousDsId) {
      const shouldRemove = this.props.config.filterItems.filter(item => item.useDataSource.dataSourceId === previousDsId).length === 1
      if(shouldRemove){
        useDSs = useDSs.filter(ds => ds.dataSourceId !== previousDsId)
      }
    }

    //add new ds id when it's not in dsArray
    const isInUseDSs = useDSs.filter(useDs => useDataSource.dataSourceId === useDs.dataSourceId).length > 0
    if (isInUseDSs) {
      useDSs = previousDsId ? useDSs : null
    } else {
      useDSs.push(useDataSource)
    }
    return useDSs
  }

  getUniqueValues = (array1: any[] = [], array2: any[] = []): any[] => {
    const array = array1.concat(array2)
    const res = array.filter(function (item, index, array) {
      return array.indexOf(item) === index
    })
    return res
  }

  getDataSourceById = (useDataSources: UseDataSource[], dataSourceId: string): ImmutableObject<UseDataSource> => {
    const dsList = useDataSources.filter(ds => ds.dataSourceId === dataSourceId)
    return Immutable(dsList[0])
  }

  changeAndOR = (logicalOperator: ClauseLogic) => {
    this.updateConfigForOptions('logicalOperator', logicalOperator)
  }

  changeUseWrap = (wrap: boolean) => {
    this.updateConfigForOptions('wrap', wrap)
  }

  changeArrangeType = (type: FilterArrangeType) => {
    if (type !== this.props.config.arrangeType) {
      this.updateConfigForOptions('arrangeType', type)
      // TODO: change wrap
    }
  }

  changeTriggerType = (type: FilterTriggerType) => {
    this.updateConfigForOptions('triggerType', type)
  }

  changeOmitInternalStyle = (omit: boolean) => {
    this.updateConfigForOptions('omitInternalStyle', omit)
  }

  onCreateDataSourceCreatedOrFailed = (dataSourceId: string, dataSource: DataSource) => {
    // The next state depends on the current state. Can't use this.state since it's not updated in in a cycle
    this.setState((state: State) => {
      const newDataSources = Object.assign({}, state.dataSources)
      newDataSources[dataSourceId] = dataSource
      return { dataSources: newDataSources }
    })
  }

  isDataSourceCreated = (dataSourceId: string) => {
    // loading or created states from data component, and it's in props.useDataSources.
    return this.state.dataSources[dataSourceId] !== null && this.props.useDataSources.filter(useDs => dataSourceId === useDs.dataSourceId).length > 0
  }

  CreateFilterItemElement = (item, index) => {
    return <div
      key={index}
      className='filter-item align-items-center'
      onClick={() => { this.onShowFilterItemPanel(index) }}
    >
      {
        item.icon && <div className='filter-item-icon'>
          <Icon icon={item.icon.svg} size={14} />
        </div>
      }
      <div className='filter-item-name flex-grow-1'>{item.name}</div>
      {
        !this.isDataSourceCreated(this.props.config.filterItems[index]?.useDataSource.dataSourceId) &&
        <Alert
          buttonType='tertiary'
          form='tooltip'
          size='small'
          type='error'
          text={this.i18nMessage('dataSourceCreateError', jimuCoreMessages)}
        >
        </Alert>
      }
      <Button
        size='sm' type="tertiary" icon
        aria-label={this.i18nMessage('delete', jimuCoreMessages)}
        onClick={(evt) => { evt.stopPropagation(); this.removeFilterItem(index) }}
      >
        <Icon icon={IconClose} size={12} />
      </Button>
    </div>
  }

  createFilterItems = (isEditingState: boolean) => {
    return (
      <div className={`filter-items-container ${this.props.config.filterItems.length > 1 ? 'mt-2' : 'mt-3'}`}>
        <List
          className='setting-ui-unit-list'
          itemsJson={this.props.config.filterItems.asMutable().map((i, x) => ({ itemStateDetailContent: i, itemKey: `${x}` }))}
          dndEnabled
          onDidDrop={(actionData, refComponent) => {
            const { itemJsons: [, listItemJsons] } = refComponent.props
            this.optionChangeByDrag((listItemJsons as any).map(i => i.itemStateDetailContent) as any)
          }}
          isItemFocused={(actionData, refComponent) => {
            const { itemJsons: [currentItemJson] } = refComponent.props
            return this.state.showFilterItemPanel && this.index + '' === (currentItemJson as TreeItemType).itemKey
          }}
          overrideItemBlockInfo={({ itemBlockInfo }) => {
            return {
              name: TreeItemActionType.RenderOverrideItem,
              children: [{
                name: TreeItemActionType.RenderOverrideItemDroppableContainer,
                children: [{
                  name: TreeItemActionType.RenderOverrideItemDraggableContainer,
                  children: [{
                    name: TreeItemActionType.RenderOverrideItemBody,
                    children: [{
                      name: TreeItemActionType.RenderOverrideItemDragHandle
                    }, {
                      name: TreeItemActionType.RenderOverrideItemMainLine
                    }]
                  }]
                }]
              }]
            }
          }}
          renderOverrideItemMainLine={(actionData, refComponent) => {
            const { itemJsons } = refComponent.props
            const currentItemJson = itemJsons[0]
            const listItemJsons = itemJsons[1] as any
            return this.CreateFilterItemElement(currentItemJson.itemStateDetailContent, listItemJsons.indexOf(currentItemJson))
          }}
        />

        {
          isEditingState && <List className='mt-1' itemsJson={[{
            itemKey: this.index + '',
            itemStateIcon: () => ({ icon: FilterIcon, size: 14 }),
            itemStateTitle: '......',
            itemStateCommands: []
          }]}
            dndEnabled={false}
            isItemFocused={() => true}
            overrideItemBlockInfo={(itemBlockInfo) => {
              return {
                name: TreeItemActionType.RenderOverrideItem,
                children: [{
                  name: TreeItemActionType.RenderOverrideItemDroppableContainer,
                  children: [{
                    name: TreeItemActionType.RenderOverrideItemDraggableContainer,
                    children: [{
                      name: TreeItemActionType.RenderOverrideItemBody,
                      children: [
                        {
                          name: TreeItemActionType.RenderOverrideItemMainLine,
                          children: [{
                            name: TreeItemActionType.RenderOverrideItemDragHandle
                          }, {
                            name: TreeItemActionType.RenderOverrideItemIcon
                          }, {
                            name: TreeItemActionType.RenderOverrideItemTitle
                          }]
                        }]
                    }]
                  }]
                }]
              }
            }}
          />
        }
      </div>
    )
  }

  render () {
    const { config } = this.props
    const isEditingState = config.filterItems.length === this.index && this.state.showFilterItemPanel
    const hasItems = config.filterItems.length > 0 || isEditingState
    return (
      <div css={getStyleForWidget(this.props.theme)}>
        <div className='jimu-widget-setting widget-setting-filter'>
          {
            this.props.useDataSources?.map((useDs, index) => {
              return (
                <FilterItemDataSource
                  key={index}
                  useDataSource={useDs}
                  onCreateDataSourceCreatedOrFailed={this.onCreateDataSourceCreatedOrFailed}
                />
              )
            })
          }
          <SettingSection className={hasItems ? '' : 'border-0'}>
            <div ref={this.sidePopperTrigger}>
              <SettingRow label={this.i18nMessage('filtersDesc')} flow='wrap'/>
              <SettingRow className='mt-2' >
                <Button className='w-100 text-dark set-link-btn' type='primary' onClick={() => { this.onShowFilterItemPanel(config.filterItems.length) }}>
                  <div className='w-100 px-2 text-truncate'>
                    <Icon icon={IconAdd} className='mr-1' size={14} />
                    {this.i18nMessage('newFilter')}
                  </div>
                </Button>
              </SettingRow>

            {
              hasItems && <React.Fragment>
                {
                  config.filterItems.length > 1 &&
                    <SettingRow>
                      <ButtonGroup className='w-100 and-or-group'>
                        <Button
                          onClick={() => { this.changeAndOR(ClauseLogic.And) }} className='btn-secondary max-width-50' size='sm'
                          type={config.logicalOperator === ClauseLogic.And ? 'primary' : 'secondary'}
                          aria-label={this.i18nMessage('and')}
                          aria-checked={config.logicalOperator === ClauseLogic.And}
                        >
                          <div className='text-truncate'>
                            {this.i18nMessage('and')}
                          </div>
                        </Button>
                        <Button
                          onClick={() => { this.changeAndOR(ClauseLogic.Or) }} className='btn-secondary max-width-50' size='sm'
                          type={config.logicalOperator === ClauseLogic.Or ? 'primary' : 'secondary'}
                          aria-label={this.i18nMessage('or')}
                          aria-checked={config.logicalOperator === ClauseLogic.Or}
                        >
                          <div className='text-truncate'>
                            {this.i18nMessage('or')}
                          </div>
                        </Button>
                      </ButtonGroup>
                    </SettingRow>
                }
                { this.createFilterItems(isEditingState) }
              </React.Fragment>
            }
            </div>
          </SettingSection>


          {
            config.filterItems.length > 0 ? <SettingSection className='arrange-style-container' title={this.i18nMessage('arrangeAndStyle')}>
              <SettingRow className='arrange_container'>
                <Tooltip title={this.i18nMessage('vertical', jimuUIMessages)} placement='bottom'>
                  <Button
                    onClick={() => this.changeArrangeType(FilterArrangeType.Block)}
                    icon size='sm' type='tertiary' active={config.arrangeType === FilterArrangeType.Block}
                    aria-label={this.i18nMessage('vertical', jimuUIMessages)}
                  >
                    <Icon width={68} height={68} icon={require('./assets/arrange_block.svg')} autoFlip />
                  </Button>
                </Tooltip>
                <Tooltip title={this.i18nMessage('horizontal', jimuUIMessages)} placement='bottom'>
                  <Button
                    onClick={() => this.changeArrangeType(FilterArrangeType.Inline)}
                    icon size='sm' type='tertiary' active={config.arrangeType === FilterArrangeType.Inline}
                    aria-label={this.i18nMessage('horizontal', jimuUIMessages)}
                  >
                    <Icon width={68} height={68} icon={require('./assets/arrange_inline.svg')} autoFlip />
                  </Button>
                </Tooltip>
                <Tooltip title={this.i18nMessage('icon', jimuCoreMessages)} placement='bottom'>
                  <Button
                    onClick={() => this.changeArrangeType(FilterArrangeType.Popper)}
                    icon size='sm' type='tertiary' active={config.arrangeType === FilterArrangeType.Popper}
                    aria-label={this.i18nMessage('icon', jimuUIMessages)}
                  >
                    <Icon width={68} height={68} icon={require('./assets/arrange_popup.svg')} autoFlip />
                  </Button>
                </Tooltip>
              </SettingRow>
              {
                config.arrangeType === FilterArrangeType.Inline && <SettingRow label={this.i18nMessage('wrapFilters')}>
                  <Switch checked={config.wrap} onChange={() => this.changeUseWrap(!config.wrap)} />
                </SettingRow>
              }
              <SettingRow label={this.i18nMessage('activationMethods')} flow='wrap' />
              <SettingRow className='trigger_container'>
                {
                  [{ type: FilterTriggerType.Toggle, icon: 'toggle' },
                    { type: FilterTriggerType.Button, icon: 'button' }].map((item, index) => {
                    return (
                      <Tooltip key={index} title={this.i18nMessage(`${item.icon}Tooltip`)} placement='bottom'>
                        <Button
                          onClick={() => this.changeTriggerType(item.type)}
                          icon size='sm' type='tertiary' active={item.type === config.triggerType}
                          aria-label={this.i18nMessage(`${item.icon}Tooltip`)}
                        >
                          <Icon width={70} height={50} icon={require(`./assets/trigger_${item.icon}.svg`)} autoFlip />
                        </Button>
                      </Tooltip>
                    )
                  })
                }
              </SettingRow>

              <SettingRow>
                <Label className='w-100 d-flex'>
                  <Checkbox
                    style={{ cursor: 'pointer', marginTop: '2px' }} onChange={() => this.changeOmitInternalStyle(!config.omitInternalStyle)}
                    checked={config.omitInternalStyle}
                  />
                  <div className='m-0 ml-2 flex-grow-1 omit-label'>
                    {this.i18nMessage('omitInternalStyle')}
                    <Tooltip title={this.i18nMessage('omitInternalStyleTip')} showArrow placement='left'>
                      <div className='ml-2 d-inline'>
                        <Icon size={16} icon={WarningIcon} />
                      </div>
                    </Tooltip>
                  </div>
                </Label>
              </SettingRow>
            </SettingSection> : <React.Fragment>
                                              {
                isEditingState ? null
                  : <div className='empty-placeholder w-100'>
                    <div className='empty-placeholder-icon'><Icon icon={IconNoData} width={48} height={48} /></div>
                    <div
                      className='empty-placeholder-text'
                      dangerouslySetInnerHTML={{ __html: this.i18nMessage('blankStatusMsg', null, { newFilter: this.i18nMessage('newFilter') }) }}
                    />
                    </div>
              }
            </React.Fragment>
          }

          <SidePopper isOpen={this.state.showFilterItemPanel && !urlUtils.getAppIdPageIdFromUrl().pageId} position='right' toggle={this.onCloseFilterItemPanel}
            trigger={this.sidePopperTrigger?.current}
          >
            <FilterItem
              {...config.filterItems[this.index]} intl={this.props.intl} theme={this.props.theme}
              useDataSource={config.filterItems[this.index]?.useDataSource}
              dataSource={this.state.dataSources[config.filterItems[this.index]?.useDataSource.dataSourceId]}
              dataSourceChange={this.dataSourceChangeForFI} optionChange={this.optionChangeForFI}
              onSqlExprBuilderChange={this.sqlExprBuilderChange} onClose={this.onCloseFilterItemPanel}
            />
          </SidePopper>

        </div>
      </div>
    )
  }
}
