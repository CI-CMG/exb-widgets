/** @jsx jsx */
import { AllWidgetProps,  jsx, DataSourceManager } from 'jimu-core';
import {Nav, NavItem, NavLink, NavMenu, Navbar} from 'jimu-ui';
import { useState, useEffect } from 'react';
import { IMConfig } from '../config';

export default function (props: AllWidgetProps<IMConfig>) {
  const [urls, setUrls] = useState([])


  useEffect(() => {
    // one time setup
    fetch(props.config.menuItemsConfigUrl)
    .then(response => response.json())
    .then(data => setUrls(data))
  },[]);


  // useEffect(() => {
  //   console.log('urls updated: ', urls)
  // }, [urls])


  return( 
    <div className="jimu-widget">
        <Navbar style={{width: '150px', textAlign: 'left'}}>
          <Nav>
            <NavItem>
              <NavLink caret>
                Category:
              </NavLink>
              <NavMenu>
                {
                  urls.map((item) => 
                    <NavItem>
                      <NavLink href={item.url} target="_blank">{item.label}</NavLink>
                    </NavItem>
                  ) 
                }
              </NavMenu>
            </NavItem>
          </Nav>
      </Navbar>
    </div>
  )
}

