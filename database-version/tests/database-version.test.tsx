import { React } from 'jimu-core';
import _Widget from '../src/runtime/widget';
import { widgetRender, wrapWidget } from 'jimu-for-test';

const render = widgetRender();
describe('test database-version widget', () => {
  it('simple test', () => {
    const Widget = wrapWidget(_Widget, {
      config: {databaseVersion: '20210414-0'},
    });
    const {queryByText} = render(<Widget widgetId="Widget_1" />);
    expect(queryByText('Database Version:  20210414-0').tagName).toBe('P');
  })
});
