import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assert } from 'chai';
import { isArazzoSpecification1Element } from '@speclynx/apidom-ns-arazzo-1';
import { isOpenApi3_0Element } from '@speclynx/apidom-ns-openapi-3-0';

import { DocumentRegistry, ArazzoDocument, OpenAPIDocument } from '../../src/index.ts';
import InvalidEntryDocumentError from '../../src/errors/InvalidEntryDocumentError.ts';
import UnmatchedProviderError from '../../src/errors/UnmatchedProviderError.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, '..', 'fixtures', 'petstore-order-workflow.arazzo.yaml');
const openapiFixturePath = path.join(__dirname, '..', 'fixtures', 'petstore.openapi.json');
const externalPathItemFixturePath = path.join(
  __dirname,
  '..',
  'fixtures',
  'external-pathitem',
  'workflow.arazzo.yaml',
);

describe('DocumentRegistry', function () {
  context('acquireEntryDocument', function () {
    specify('should acquire and return an ArazzoDocument', async function () {
      const registry = new DocumentRegistry();
      const doc = await registry.acquireEntryDocument(fixturePath);

      assert.instanceOf(doc, ArazzoDocument);
    });

    specify('should mark the document as entry', async function () {
      const registry = new DocumentRegistry();
      const doc = await registry.acquireEntryDocument(fixturePath);

      assert.isTrue(doc.isEntry);
    });

    specify('should set the entry document on the registry', async function () {
      const registry = new DocumentRegistry();
      await registry.acquireEntryDocument(fixturePath);

      assert.instanceOf(registry.entryDocument, ArazzoDocument);
      assert.isTrue(registry.entryDocument!.isEntry);
    });

    specify('should contain Arazzo specification in parseResult', async function () {
      const registry = new DocumentRegistry();
      const doc = await registry.acquireEntryDocument(fixturePath);

      assert.isTrue(isArazzoSpecification1Element(doc.parseResult.api));
    });

    specify('should build a workflow index', async function () {
      const registry = new DocumentRegistry();
      const doc = await registry.acquireEntryDocument(fixturePath);

      assert.deepEqual(Object.fromEntries(doc.workflowIndex), {
        authenticateAndOrderPet: '/workflows/0',
      });
    });

    specify('should build a step index', async function () {
      const registry = new DocumentRegistry();
      const doc = await registry.acquireEntryDocument(fixturePath);

      assert.deepEqual(Object.fromEntries(doc.stepIndex), {
        loginUser: '/workflows/0/steps/0',
        findAvailablePets: '/workflows/0/steps/1',
        placeOrder: '/workflows/0/steps/2',
        retrieveOrderedPetDetails: '/workflows/0/steps/3',
        verifyOrderConfirmation: '/workflows/0/steps/4',
      });
    });
  });

  context('acquire', function () {
    specify('should return cached document on second call', async function () {
      const registry = new DocumentRegistry();
      const doc1 = await registry.acquireEntryDocument(fixturePath);
      const doc2 = await registry.acquire(fixturePath);

      assert.strictEqual(doc1, doc2);
    });

    context('given entry document with OpenAPI source description', function () {
      specify('should acquire OpenAPI source document', async function () {
        const registry = new DocumentRegistry();
        const entryDoc = await registry.acquireEntryDocument(fixturePath);
        const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI');
        const sourceDoc = await registry.acquire(sourceURI!);

        assert.instanceOf(sourceDoc, OpenAPIDocument);
      });

      specify('should contain OpenAPI specification in parseResult', async function () {
        const registry = new DocumentRegistry();
        const entryDoc = await registry.acquireEntryDocument(fixturePath);
        const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI')!;
        const sourceDoc = await registry.acquire(sourceURI);

        assert.isTrue(isOpenApi3_0Element(sourceDoc.parseResult.api));
      });

      specify('should build an operation index', async function () {
        const registry = new DocumentRegistry();
        const entryDoc = await registry.acquireEntryDocument(fixturePath);
        const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI');
        const sourceDoc = (await registry.acquire(sourceURI!)) as OpenAPIDocument;

        assert.deepEqual(Object.fromEntries(sourceDoc.operationIndex), {
          updatePet: '/paths/~1pet/put',
          addPet: '/paths/~1pet/post',
          findPetsByStatus: '/paths/~1pet~1findByStatus/get',
          findPetsByTags: '/paths/~1pet~1findByTags/get',
          getPetById: '/paths/~1pet~1{petId}/get',
          updatePetWithForm: '/paths/~1pet~1{petId}/post',
          deletePet: '/paths/~1pet~1{petId}/delete',
          uploadFile: '/paths/~1pet~1{petId}~1uploadImage/post',
          getInventory: '/paths/~1store~1inventory/get',
          placeOrder: '/paths/~1store~1order/post',
          getOrderById: '/paths/~1store~1order~1{orderId}/get',
          deleteOrder: '/paths/~1store~1order~1{orderId}/delete',
          createUser: '/paths/~1user/post',
          createUsersWithListInput: '/paths/~1user~1createWithList/post',
          loginUser: '/paths/~1user~1login/get',
          logoutUser: '/paths/~1user~1logout/get',
          getUserByName: '/paths/~1user~1{username}/get',
          updateUser: '/paths/~1user~1{username}/put',
          deleteUser: '/paths/~1user~1{username}/delete',
        });
      });
    });
  });

  context('resolveSourceDescriptionURI', function () {
    specify('should resolve known source description to absolute path', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const sourceURI = entryDoc.resolveSourceDescriptionURI('petstoreAPI');

      assert.strictEqual(sourceURI, openapiFixturePath);
    });

    specify('should return undefined for unknown source description', async function () {
      const registry = new DocumentRegistry();
      const entryDoc = await registry.acquireEntryDocument(fixturePath);
      const sourceURI = entryDoc.resolveSourceDescriptionURI('nonExistent');

      assert.isUndefined(sourceURI);
    });
  });

  context('acquireEntryDocument with non-Arazzo document', function () {
    specify('should throw InvalidEntryDocumentError', async function () {
      const registry = new DocumentRegistry();

      try {
        await registry.acquireEntryDocument(openapiFixturePath);
        assert.fail('Expected InvalidEntryDocumentError to be thrown');
      } catch (error) {
        assert.instanceOf(error, InvalidEntryDocumentError);
      }
    });
  });

  context('acquire with unsupported document', function () {
    specify('should throw UnmatchedProviderError', async function () {
      const registry = new DocumentRegistry();
      const unsupportedPath = path.join(__dirname, '..', 'fixtures', 'unsupported.txt');

      try {
        await registry.acquire(unsupportedPath);
        assert.fail('Expected UnmatchedProviderError to be thrown');
      } catch (error) {
        assert.instanceOf(error, UnmatchedProviderError);
      }
    });
  });

  context('clear', function () {
    specify('should remove all documents', async function () {
      const registry = new DocumentRegistry();
      await registry.acquireEntryDocument(fixturePath);

      registry.clear();

      assert.isUndefined(registry.entryDocument);
    });
  });

  context('given OpenAPI source with external PathItem $ref', function () {
    specify(
      'should include operations from external path item in operation index',
      async function () {
        const registry = new DocumentRegistry();
        const entryDoc = await registry.acquireEntryDocument(externalPathItemFixturePath);
        const sourceURI = entryDoc.resolveSourceDescriptionURI('testAPI')!;
        const sourceDoc = (await registry.acquire(sourceURI)) as OpenAPIDocument;

        assert.deepEqual(Object.fromEntries(sourceDoc.operationIndex), {
          listPets: '/paths/~1pets/get',
          createPet: '/paths/~1pets/post',
          getPetById: '/paths/~1pets~1{petId}/get',
        });
      },
    );
  });
});
