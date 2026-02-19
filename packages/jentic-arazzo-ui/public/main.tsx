import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ArazzoViewer } from '../src/index';
import type { ArazzoDocument, ViewerMode } from '../src/types/index';

function JenticLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" {...props}>
      <rect fill="none" width="1200" height="400" rx="16" ry="16" />
      <g>
        <g>
          <path
            fill="#fff"
            d="M362.5,78c-8.8-1.2-18.9,11.2-27.7,33.4-10.1,25.8-20.3,51.6-31.1,76.6v.2c-.1,0-6.1,14.2-6.1,14.2h0s-.2.5-.2.5c-4.5,10.6-19.3,45.4-24,56.6-3.2,7.5-6.6,14.7-10.2,21.5,0,0,0,0,0,0h0s0,0,0,.1c-2.5,4.8-5.3,9.2-8.3,13.1-20.6,26.7-48.3,33.8-68.6,35-30.4.5-70.8-11.8-87.6-57.3-8-20.6-9.9-45.6-9.3-69.6h140.1s-5.6,13-5.6,13l-1.2,2.6-11.8.3c-10.2.3-20.2.1-30.6.6-9.2.4-17.8-.3-25,7.9-2.9,3.2-4.8,7.2-5.7,11.4-1.4,5.8-.6,10.1,2.3,17.2,5.9,13,17.9,20.8,32.1,20.8s.9,0,1.3,0c8.1-.3,16.5-3.1,23.4-8.3,6.1-4.6,10.7-11.6,14.3-19.5l9-22.5,57.3-135.2h0s0,0,0,0c1.5-3.7,2.9-7.4,4.4-11.1,0,0,0,0,0-.1,2.6-6.4,5.6-6.4,5.6-6.4,0,0,9.5-2.4,29.6-2.4s30.5,1.6,31.1,2c.5.4,2.6.6,2.5,5.3h0Z"
          />
          <path
            fill="#fff"
            d="M404,202.5h-.1l-7.5-23.9v-.2c0,0-8-25.1-8-25.1h0s-14.8-46.9-14.8-46.9c-2.8-8.3-5.2-16.9-12-15.5-12,2.6-18.9,22.6-24.6,38.3-1.4,3.7-2.8,7.8-3.6,12.2l1.8,2.2,47.8,58.8.5.6h-74.2c0,0-.1.2-.1.2l-5.4,12.5-1.2,2.7h106.6l-5.1-15.9h0ZM388.2,213.5h0s0,0,0,0h0Z"
          />
        </g>
        <g>
          <path
            fill="#fff"
            d="M963.6,166.7c-6.2,0-10.7-1.6-13.7-4.8-3-3.2-4.4-7.3-4.4-12.2s1.5-9.2,4.4-12.5c3-3.2,7.5-4.8,13.7-4.8s10.7,1.6,13.7,4.8c3,3.2,4.4,7.4,4.4,12.5s-1.5,9-4.4,12.2c-3,3.2-7.5,4.8-13.7,4.8Z"
          />
          <g>
            <path
              fill="#fff"
              d="M682.6,182.1c-8.3-5.4-18.5-8.1-30.6-8.1s-17.4,1.6-24.6,4.8c-7.2,3.2-13.2,7.6-18.1,13.1-4.9,5.5-8.6,11.7-11.1,18.6-2.5,6.9-3.8,14.2-3.8,21.7v4.1c0,7.3,1.3,14.4,3.8,21.3s6.3,13.2,11.2,18.8c4.9,5.6,11.1,10.1,18.4,13.4,7.3,3.3,15.8,4.9,25.4,4.9s17.8-1.7,25.1-5c7.3-3.4,13.3-8,18.1-13.9,4.8-5.9,8-12.6,9.7-20.2h-30.3c-1.4,3.4-4,6.3-7.8,8.6-3.8,2.3-8.8,3.5-14.8,3.5s-11.9-1.4-16.1-4.1c-4.1-2.7-7.1-6.6-9.1-11.6-1.1-2.8-1.8-5.9-2.3-9.2h82.4v-11.1c0-10.3-2.2-19.8-6.6-28.5-4.4-8.7-10.7-15.8-19-21.2h0ZM628.4,216.1c2.1-5,5.1-8.8,9.1-11.3,4-2.5,8.8-3.8,14.6-3.8s10.3,1.3,14.1,3.8c3.8,2.5,6.6,6.2,8.4,10.9,1,2.5,1.7,5.4,2.2,8.5h-50.7c.5-3,1.3-5.7,2.3-8.1h0Z"
            />
            <path
              fill="#fff"
              d="M791.6,174.4h-1.4c-8.7,0-16,1.9-22,5.8-6,3.8-10.5,9.6-13.5,17.3-1,2.7-1.9,5.7-2.6,8.9v-28.5h-26.3v112.8h33.2v-65.7c0-6.3,1.9-11.4,5.7-15.2,3.8-3.8,8.8-5.8,14.9-5.8s10.8,1.9,14.3,5.7c3.5,3.8,5.2,8.7,5.2,14.7v66.3h33.2v-64.4c0-17.4-3.5-30.4-10.4-39-6.9-8.6-17-12.9-30.2-12.9h0Z"
            />
            <path
              fill="#fff"
              d="M890.3,147.4h-30.7v30.5h-17.3v24.3h17.2v44.5c0,11.4,1.6,20.4,4.8,27.1,3.3,6.7,8.4,11.4,15.4,14.3,7,2.9,16.2,4.3,27.6,4.3h15.8v-28h-16.7c-5.2,0-9.2-1.4-12-4.2-2.8-2.8-4.2-6.9-4.2-12.2v-45.7h32.9v-24.3h-32.9v-30.5h0Z"
            />
            <polygon
              fill="#fff"
              points="983.8 177.9 950.6 177.9 950.6 177.9 943.5 177.9 935.7 202.3 950.6 202.3 950.6 290.7 983.8 290.7 983.8 202.4 983.8 202.4 983.8 177.9 983.8 177.9 983.8 177.9"
            />
            <path
              fill="#fff"
              d="M1078.7,247.7c-.6,3.7-1.7,7-3.5,9.8-1.8,2.8-4.2,5-7.3,6.6-3.1,1.6-6.8,2.4-11.2,2.4s-10.7-1.3-14.3-4c-3.6-2.7-6.3-6.5-7.9-11.3s-2.5-10.3-2.5-16.4.9-12.1,2.7-17c1.8-4.9,4.5-8.7,8.1-11.4,3.6-2.7,8.2-4.1,13.7-4.1s11.5,1.8,15,5.2c3.6,3.5,5.6,7.9,6.2,13.1h32.3c-.6-9.2-3.2-17.3-7.8-24.3-4.7-7-10.9-12.5-18.7-16.4-7.8-3.9-16.8-5.9-27-5.9s-17.6,1.6-24.8,4.7c-7.2,3.2-13.2,7.5-18.1,13s-8.5,11.8-11,18.8c-2.5,7.1-3.7,14.4-3.7,22.1v3.9c0,7.4,1.2,14.6,3.6,21.5,2.4,6.9,6,13.1,10.8,18.6,4.8,5.5,10.8,9.9,17.9,13.2,7.1,3.3,15.7,4.9,25.5,4.9s19.2-2,27.2-6c8-4,14.3-9.5,19.2-16.6,4.8-7.1,7.4-15.3,7.8-24.6h-32.1,0Z"
            />
            <path
              fill="#fff"
              d="M508.7,138l-9.8,30.6h43.8l.7.5c1.2.9,1.7,1.7,1.7,3.2,0,9.5-.1,19.1-.2,27.5-.2,11.7-.3,25-.1,37.6v.3c-1.6,17.5-16.8,27-30.2,27s-19.8-5.9-24.2-15.7c-4.8-10.6-1.3-20,2.2-26.9l1.5-3h-33l-.5,1.3c-5.2,13.1-5.1,27.6.4,41,5.9,14.5,17.6,26,32,31.4,7,2.6,14.3,4,21.6,4,15.8,0,31.1-6.2,43.1-17.4,12.1-11.4,19.4-26.6,20.6-43h0c0,0,0-98.4,0-98.4h-69.5,0Z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

const sampleDocument: ArazzoDocument = {
  arazzo: '1.0.1',
  info: {
    title: 'Petstore Order Workflow',
    version: '1.0.0',
    summary:
      'End-to-end workflow for user authentication, pet discovery, order placement, and order confirmation',
    description:
      'This workflow demonstrates a complete e-commerce flow in the Petstore API: authenticate a user, find available pets matching criteria, place an order for the best match, retrieve the ordered pet details, and return consolidated order information. Designed for both human operators and AI agents executing deterministic business logic.',
  },
  sourceDescriptions: [
    {
      name: 'petstoreAPI',
      url: 'https://petstore3.swagger.io/api/v3/openapi.json',
      type: 'openapi',
    },
  ],
  workflows: [
    {
      workflowId: 'authenticateAndOrderPet',
      summary: 'Complete pet ordering workflow with authentication',
      description:
        'Authenticate user, discover available pets, place order, retrieve details, and return comprehensive order summary',
      inputs: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'User login identifier',
          },
          password: {
            type: 'string',
            description: 'User password for authentication',
          },
          preferredPetStatus: {
            type: 'string',
            description: 'Desired pet availability status',
            default: 'available',
            enum: ['available', 'pending', 'sold'],
          },
          orderQuantity: {
            type: 'integer',
            description: 'Number of pets to order',
            default: 1,
          },
        },
        required: ['username', 'password'],
      },
      steps: [
        {
          stepId: 'loginUser',
          description: 'Authenticate user and obtain session token',
          operationId: 'loginUser',
          parameters: [
            { name: 'username', in: 'query', value: '$inputs.username' },
            { name: 'password', in: 'query', value: '$inputs.password' },
          ],
          successCriteria: [{ condition: '$statusCode == 200' }],
          outputs: {
            sessionToken: '$response.body',
            tokenExpiry: '$response.header.X-Expires-After',
            rateLimit: '$response.header.X-Rate-Limit',
          },
        },
        {
          stepId: 'findAvailablePets',
          description: 'Query pets matching the preferred status to identify ordering candidates',
          operationId: 'findPetsByStatus',
          parameters: [{ name: 'status', in: 'query', value: '$inputs.preferredPetStatus' }],
          successCriteria: [
            { condition: '$statusCode == 200' },
            {
              condition: '$response.body && $response.body.length > 0',
              context: 'response',
              type: 'simple',
            },
          ],
          outputs: {
            availablePets: '$response.body',
            petCount: '$response.body.length',
            bestMatchPet: '$response.body[0]',
            bestMatchPetId: '$response.body[0].id',
          },
          onFailure: [{ name: 'noPetsAvailable', type: 'end' }],
        },
        {
          stepId: 'placeOrder',
          description: 'Place order for the best matching pet from the available inventory',
          operationId: 'placeOrder',
          requestBody: {
            contentType: 'application/json',
            payload: {
              petId: '$steps.findAvailablePets.outputs.bestMatchPetId',
              quantity: '$inputs.orderQuantity',
              shipDate: '$datetime.iso8601',
              status: 'placed',
              complete: false,
            },
          },
          successCriteria: [
            { condition: '$statusCode == 200' },
            { condition: '$response.body.id != null', context: 'response', type: 'simple' },
          ],
          outputs: {
            orderId: '$response.body.id',
            orderStatus: '$response.body.status',
            orderQuantity: '$response.body.quantity',
            orderShipDate: '$response.body.shipDate',
            orderComplete: '$response.body.complete',
          },
        },
        {
          stepId: 'retrieveOrderedPetDetails',
          description: 'Fetch complete details of the ordered pet to enrich order summary',
          operationId: 'getPetById',
          parameters: [
            {
              name: 'petId',
              in: 'path',
              value: '$steps.findAvailablePets.outputs.bestMatchPetId',
            },
          ],
          successCriteria: [{ condition: '$statusCode == 200' }],
          outputs: {
            petName: '$response.body.name',
            petCategory: '$response.body.category.name',
            petId: '$response.body.id',
            petStatus: '$response.body.status',
            petPhotoUrls: '$response.body.photoUrls',
            petTags: '$response.body.tags',
          },
        },
        {
          stepId: 'verifyOrderConfirmation',
          description: 'Retrieve and validate the placed order to ensure successful processing',
          operationId: 'getOrderById',
          parameters: [
            {
              name: 'orderId',
              in: 'path',
              value: '$steps.placeOrder.outputs.orderId',
            },
          ],
          successCriteria: [
            { condition: '$statusCode == 200' },
            { condition: "$response.body.status == 'placed'" },
          ],
          outputs: {
            confirmedOrderId: '$response.body.id',
            confirmedOrderStatus: '$response.body.status',
            confirmedPetId: '$response.body.petId',
            confirmedQuantity: '$response.body.quantity',
          },
        },
      ],
      outputs: {
        petName: '$steps.retrieveOrderedPetDetails.outputs.petName',
        petCategory: '$steps.retrieveOrderedPetDetails.outputs.petCategory',
        petId: '$steps.retrieveOrderedPetDetails.outputs.petId',
        orderId: '$steps.placeOrder.outputs.orderId',
        orderStatus: '$steps.verifyOrderConfirmation.outputs.confirmedOrderStatus',
        orderQuantity: '$steps.placeOrder.outputs.orderQuantity',
        orderShipDate: '$steps.placeOrder.outputs.orderShipDate',
        sessionToken: '$steps.loginUser.outputs.sessionToken',
      },
      failureActions: [
        {
          name: 'orderFailed',
          type: 'end',
          criteria: [{ condition: '$statusCode == 500' }],
        },
        {
          name: 'retryOnServiceUnavailable',
          type: 'retry',
          retryLimit: 3,
          retryAfter: 1,
          criteria: [{ condition: '$statusCode == 503' }],
        },
      ],
    },
  ],
};

const views: ViewerMode[] = ['diagram', 'docs', 'split'];

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewerMode;
  onChange: (v: ViewerMode) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: '6px',
        border: '1px solid #444',
        overflow: 'hidden',
        fontSize: '13px',
      }}
    >
      {views.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            padding: '4px 12px',
            border: 'none',
            borderRight: v !== views[views.length - 1] ? '1px solid #444' : 'none',
            background: value === v ? '#fff' : '#2a2a2a',
            color: value === v ? '#1B1B1B' : '#ccc',
            cursor: value === v ? 'default' : 'pointer',
            fontWeight: value === v ? 600 : 400,
            textTransform: 'capitalize',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [view, setView] = useState<ViewerMode>('docs');
  const [urlInput, setUrlInput] = useState('');
  const [documentSource, setDocumentSource] = useState<ArazzoDocument | string>(sampleDocument);

  const handleExplore = useCallback(() => {
    const trimmed = urlInput.trim();
    if (trimmed) {
      setDocumentSource(trimmed);
    }
  }, [urlInput]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleExplore();
      }
    },
    [handleExplore],
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'relative',
          padding: '8px 16px',
          borderBottom: '1px solid #1B1B1B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1B1B1B',
        }}
      >
        <a
          href="https://jentic.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Supported by Jentic"
        >
          <JenticLogo style={{ height: '36px' }} />
        </a>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '520px',
          }}
        >
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Arazzo document URL..."
            style={{
              flex: 1,
              padding: '6px 12px',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              background: '#2a2a2a',
              color: '#fff',
            }}
          />
          <button
            onClick={handleExplore}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '6px',
              background: '#61affe',
              color: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Explore
          </button>
        </div>
        <SegmentedControl value={view} onChange={setView} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ArazzoViewer
          document={documentSource}
          view={view}
          onNodeSelect={(id) => console.log('node selected:', id)}
          onWorkflowSelect={(id) => console.log('workflow selected:', id)}
        />
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
