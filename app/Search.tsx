'use client';

import { liteClient as algoliasearch } from 'algoliasearch/lite';
import Image from 'next/image';
import { Hit as AlgoliaHit } from 'instantsearch.js';
import { createInsightsMiddleware } from 'instantsearch.js/es/middlewares';
import React, { useLayoutEffect } from 'react';
import {
  Hits,
  Highlight,
  SearchBox,
  RefinementList,
  DynamicWidgets,
  useInstantSearch,
  SortBy
} from 'react-instantsearch';
import { InstantSearchNext } from 'react-instantsearch-nextjs';
import { Panel } from '../components/Panel';

// Remove the import if you inject the script in the HTML
import aa from 'search-insights';

const APP_ID='TBEEBDFYJF'
const API_KEY='bdefc37a89c8bfd234326a5325e71836'

aa('init', {
  appId: APP_ID,
  apiKey: API_KEY,
  useCookie: true,
});

aa('getUserToken', {}, (err: any, userToken: any) => {
  if (err) {
    console.error(err);
    return;
  }
  if (!userToken) {
    console.error('No user token');
    return;
  }
  // The `insights` middleware receives a notification
  // and attaches the `userToken` to search calls onwards.
  aa('setUserToken', userToken );
  console.log('userToken', userToken);
});


function InsightsMiddleware() {
  const { addMiddlewares } = useInstantSearch();

  useLayoutEffect(() => {
    const middleware = createInsightsMiddleware({
      insightsClient: aa,
    });

    return addMiddlewares(middleware);
  }, [addMiddlewares]);

  return null;
}
const client = algoliasearch(APP_ID, API_KEY);

type HitProps = {
  hit: AlgoliaHit<{
    name: string;
    price: number;
    image: string;
  }>;
};

function Hit({ hit }: HitProps) {
  return (
    <>
      <div style={{ width: 50 }}>
        <div style={{ height: 50, maxWidth: 'fit-content', display: 'flex', alignItems: 'center', margin: '0 auto' }}>
          <Image src={hit.image}
            width={500}
            height={500}
            className='search-result-image'
            alt="Picture of the author"
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>
      <Highlight hit={hit} attribute="name" className="Hit-label" />
      <span className="Hit-price">${hit.price}</span>
    </>
  );
}

export default function Search() {
  return (
    <InstantSearchNext searchClient={client} indexName="revised_project" routing insights={true}>
      <div className="Container">
        <div className="SidePanel">
          <DynamicWidgets fallbackComponent={FallbackComponent} />
        </div>
        <div className="centerSection-wrapper">
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <SearchBox />
            <SortBy
              items={[
                { label: 'Featured', value: 'revised_project' },
                { label: 'Price (asc)', value: 'revised_project_price_asc' },
                { label: 'Price (desc)', value: 'revised_project_price_desc' },
              ]}
            />
          </div>
          <Hits hitComponent={Hit} />
        </div>
      </div>
      <InsightsMiddleware />
    </InstantSearchNext>
  );
}

function FallbackComponent({ attribute }: { attribute: string }) {
  return (
    <Panel header={attribute}>
      <RefinementList attribute={attribute} />
    </Panel>
  );
}
