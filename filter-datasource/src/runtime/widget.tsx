/** @jsx jsx */
import {
  React, classNames, AllWidgetProps, jsx, DataSource, QueriableDataSource, appActions,
  dataSourceUtils, ImmutableArray, UseDataSource, ImmutableObject, Immutable, IMSqlExpression, IconResult, DataSourceStatus
} from 'jimu-core'
import { WidgetConfig, filterItemConfig, filterConfig, FilterArrangeType } from '../config'
import FilterItem from './filter-item'
import { WidgetPlaceholder, Button, Icon, Popper, Badge, maxSizeModifier, applyMaxSizeModifier, getCustomFlipModifier } from 'jimu-ui'
import { versionManager } from '../version-manager'
import defaultMessages from './translations/default'
import { getStyles } from './style'
import { getShownClauseNumberByExpression, getTotalClauseNumberByExpression } from 'jimu-ui/basic/sql-expression-runtime'
import FilterItemDataSource from './filter-item-ds'

const FilterIcon = require('jimu-ui/lib/icons/filter-2.svg')

interface State{
  popperVersion: number
  isOpen: boolean
  // needQuery: boolean;
  filterItems: ImmutableArray<filterItemConfig>
  dataSources: { [dsId: string]: DataSource }
  outputDataSourceIsNotReady: { [dsId: string]: boolean}
}

const modifiers = [
  getCustomFlipModifier({ fallbackPlacements: ['top', 'left', 'right'], useClosestVerticalPlacement: true }),
  maxSizeModifier,
  applyMaxSizeModifier
]

export default class Widget extends React.PureComponent<AllWidgetProps<WidgetConfig>, State> {
  static versionManager = versionManager

  index: number
  // filterItems: ImmutableArray<filterItemConfig>;
  widgetIconRef: any
  _autoApplyInit: boolean
  __unmount: boolean

  constructor (props) {
    super(props)
    this.__unmount = false
    this.index = 0
    this._autoApplyInit = true
    this.state = {
      popperVersion: 1,
      isOpen: false,
      // needQuery: true,
      filterItems: this.props.config.filterItems,
      dataSources: {},
      outputDataSourceIsNotReady: {}
    }
  }

  componentWillUnmount () {
    this.__unmount = true
    Object.keys(this.state.dataSources).map(dsId => {
      // added to OOTB widget to share state via the Redux Store. removes any filter criteria
      this.props.dispatch(appActions.widgetStatePropChange(this.props.id, 'sqlString', "1=1"));
      (this.state.dataSources[dsId] as QueriableDataSource)?.updateQueryParams(null, this.props.id)
    })
  }

  componentDidUpdate (prevProps: AllWidgetProps<filterConfig>, prevState: State) {
    if (this.__unmount) {
      return
    }
    this._autoApplyInit = false
    // refresh all sqls for different dataSources when setting's changed
    if (prevProps.config !== this.props.config) {
      this.setState({
        filterItems: this.props.config.filterItems
      })
      this.setSqlToAllDs()
      // update auto apply by arrangement & styles
    } else if (this.state.dataSources !== prevState.dataSources) {
      this._autoApplyInit = true
      this.applyAutoFiltersAtStart()
    }
    // else if(this.state.filterItems !== prevState.filterItems && this.state.needQuery){
    //   this.setState({needQuery: false});
    //   this.setSqlToAllDs();
    // }
  }

  setSqlToAllDs = () => {
    Object.keys(this.state.dataSources).map(dsId => {
      const ds = this.state.dataSources[dsId]
      if (ds) { // exclude invalid dataSources
        const sql = this.getQuerySqlFromDs(ds)
        // if(sql !== ''){
        this.setSqlToDs(ds, sql)
        // }
      }
    })
  }

  onFilterItemChange = (index: number, dataSource: DataSource, sqlExprObj: IMSqlExpression, applied: boolean) => {
    if (this.__unmount) {
      return
    }
    // current filter item is destoryed and applied, fItem has alread been removed from state by didUpdate
    if (!this.state.filterItems[index] && applied) {
      this.setSqlToDs(dataSource, '')
      return
    }

    // update fitlerItem
    const fItems = this.state.filterItems.asMutable({ deep: true })
    const needQuery = !((!applied && !fItems[index].autoApplyWhenWidgetOpen))
    const fItem = Object.assign({}, fItems[index], { sqlExprObj: sqlExprObj, autoApplyWhenWidgetOpen: applied })
    fItems.splice(index, 1, fItem)
    const filterItems = Immutable(fItems)
    this.setState({
      filterItems: filterItems
    })

    if (needQuery) {
      const sql = this.getQuerySqlFromDs(dataSource, filterItems)
      this.setSqlToDs(dataSource, sql)
    }
  }

  setSqlToDs = (dataSource: DataSource, sql: string) => {
    // added to OOTB widget to share state via the Redux Store
    this.props.dispatch(appActions.widgetStatePropChange(this.props.id, 'sqlString', sql));
    (dataSource as QueriableDataSource)?.updateQueryParams?.({ where: sql } as any, this.props.id)
  }

  getQuerySqlFromDs = (dataSource: DataSource, filterItems = this.props.config.filterItems) => {
    const sqls = [] // get sqls for current ds
    filterItems.map(item => {
      // collect sqls from autoApplid, manual apply, or expaned single clause. dataSource could be null when it's not available.
      if (item.useDataSource.dataSourceId === dataSource?.id && (item.autoApplyWhenWidgetOpen || (this.props.config.omitInternalStyle && getShownClauseNumberByExpression(item.sqlExprObj) === 1))) {
        const _sql = dataSourceUtils.getArcGISSQL(item.sqlExprObj, dataSource).sql
        if (_sql) {
          sqls.push(_sql)
        }
      }
    })
    let sqlString = ''
    if (sqls.length) {
      sqlString = sqls.length === 1 ? sqls[0] : '(' + sqls.join(') ' + this.props.config.logicalOperator + ' (') + ')'
    }
    return sqlString
  }

  getDataSourceById = (dataSourceId: string): ImmutableObject<UseDataSource> => {
    const dsList = this.props.useDataSources.asMutable({ deep: true }).filter(ds => ds.dataSourceId === dataSourceId)
    return Immutable(dsList[0])
  }

  // check if it's in props.useDataSources.
  isDataSourceRemoved = (dataSourceId: string) => {
    return this.props.useDataSources?.filter(useDs => dataSourceId === useDs.dataSourceId).length === 0
  }

  getFilterItems = (config, arrangeType = FilterArrangeType.Block, wrap = false, isPopup = false) => {
    return (
      <div
        className={classNames('w-100 h-100',
          arrangeType && config.arrangeType === FilterArrangeType.Inline ? 'filter-items-inline' : '',
          wrap ? 'filter-items-wrap' : '', isPopup ? 'filter-items-popup' : '')} css={getStyles(this.props.theme)}
      >
        {(this.state.filterItems as unknown as filterItemConfig[]).map((item, index) => {
          const ds = this.isDataSourceRemoved(item.useDataSource.dataSourceId) ? null : this.state.dataSources[item.useDataSource.dataSourceId]
          const isNotReadyFromWidget = this.state.outputDataSourceIsNotReady[item.useDataSource.dataSourceId]
          return (
            <FilterItem
              key={index} id={index} widgetId={this.props.id} intl={this.props.intl}
              selectedDs={ds} useDataSource={item.useDataSource}
              isNotReadyFromWidget={isNotReadyFromWidget} logicalOperator={config.logicalOperator} config={item}
              arrangeType={arrangeType} triggerType={config.triggerType} wrap={wrap} omitInternalStyle={config.omitInternalStyle} filterNum={this.state.filterItems.length}
              onChange={this.onFilterItemChange} itemBgColor={this.props.theme.colors.palette.light[300]} theme={this.props.theme}
            />
          )
        })}
      </div>
    )
  }

  onShowPopper = () => {
    this.setState({
      isOpen: !this.state.isOpen,
      popperVersion: !this.state.isOpen ? this.state.popperVersion + 1 : this.state.popperVersion
    })
  }

  onTogglePopper = () => {
    this.setState({
      isOpen: false
    })
  }

  checkIfAnyFiltersApplied = (): boolean => {
    const { omitInternalStyle } = this.props.config
    const filterItems = this.state?.filterItems || this.props.config.filterItems
    const isApplied = (filterItems as unknown as filterItemConfig[]).some((item) => {
      if (omitInternalStyle && getTotalClauseNumberByExpression(item.sqlExprObj) === 1 && getShownClauseNumberByExpression(item.sqlExprObj) === 1) {
        // ds exists, or it hasn't created when widget starts
        return (this.state.dataSources[item.useDataSource.dataSourceId]
          ? dataSourceUtils.getArcGISSQL(item.sqlExprObj, this.state.dataSources[item.useDataSource.dataSourceId]).sql : item.sqlExprObj.sql) !== ''
      } else {
        return item.autoApplyWhenWidgetOpen
      }
    })
    return isApplied
  }

  onIsDataSourceNotReady = (dataSourceId: string, dataSourceStatus) => {
    this.setState((state: State) => {
      const isOutPutDs = state.dataSources[dataSourceId]?.getDataSourceJson().isOutputFromWidget
      if (!isOutPutDs) {
        return
      }
      const outputDataSource = Object.assign({}, state.outputDataSourceIsNotReady)
      outputDataSource[dataSourceId] = dataSourceStatus === DataSourceStatus.NotReady
      return { outputDataSourceIsNotReady: outputDataSource }
    })
  }

  onCreateDataSourceCreatedOrFailed = (dataSourceId: string, dataSource: DataSource) => {
    this.setState((state: State) => {
      const newDataSources = Object.assign({}, state.dataSources)
      newDataSources[dataSourceId] = dataSource
      return { dataSources: newDataSources }
    })
  }

  // Only for first time & autoApply option, after all datasources are ready
  applyAutoFiltersAtStart = () => {
    if (this._autoApplyInit) {
      const dsLength = Object.keys(this.state.dataSources).map(() => true).length
      if (dsLength === this.props.useDataSources?.length) {
        this._autoApplyInit = false
        setTimeout(() => {
          this.setSqlToAllDs()
        }, 0)
      }
    }
  }

  render () {
    const { config, icon, label } = this.props
    if (this.state.filterItems.length === 0) {
      return (
        <WidgetPlaceholder
          icon={FilterIcon} widgetId={this.props.id}
          message={this.props.intl.formatMessage({ id: '_widgetLabel', defaultMessage: defaultMessages._widgetLabel })}
        />
      )
    }
    return (
      <div className='jimu-widget widget-filter overflow-auto'>
        {
          this.props.useDataSources?.map((useDs, key) => {
            return (
              <FilterItemDataSource
                key={key}
                useDataSource={useDs}
                onIsDataSourceNotReady={this.onIsDataSourceNotReady}
                onCreateDataSourceCreatedOrFailed={this.onCreateDataSourceCreatedOrFailed}
              />
            )
          })
        }
        {
          // Filters & Clauses on Popup are as the same as Block panel.
          config.arrangeType === FilterArrangeType.Popper ? <div className='filter-widget-popper'>
            <Badge dot className='m-1' hideBadge={!this.checkIfAnyFiltersApplied()} color='primary'>
              <Button
                icon size='sm' className='filter-widget-pill h-100'
                ref={ref => this.widgetIconRef = ref}
                title={label}
                type='tertiary'
                onClick={this.onShowPopper}
              >
                <Icon
                  icon={typeof icon === 'string' ? icon : (icon as IconResult).svg} size={16}
                  color={typeof icon === 'string' ? '' : (icon as IconResult).properties.color}
                />
              </Button>
            </Badge>
            {
              this.state.popperVersion > 1 && <Popper
                open={this.state.isOpen}
                version={this.state.popperVersion}
                keepMount
                toggle={this.onTogglePopper}
                showArrow
                modifiers={modifiers}
                reference={this.widgetIconRef}>
                <div className='p-2'>
                  {this.getFilterItems(config, FilterArrangeType.Block, false, true)}
                </div>
                                              </Popper>
            }
                                                            </div> : <div className='w-100 h-100'>
            {this.getFilterItems(config, config.arrangeType, config.wrap)}
                   </div>
        }
      </div>
    )
  }
}
