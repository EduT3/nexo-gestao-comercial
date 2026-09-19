import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { Permission } from '../../../shared/contracts.js';
import { authContext, requireCompany } from '../../core/access.js';
import { params, validId } from '../../core/validation.js';
import type { Db } from '../../db.js';
import {
  categoryPatchSchema,
  categorySchema,
  customerPatchSchema,
  customerSchema,
  listQuerySchema,
  productPatchSchema,
  productSchema,
  supplierPatchSchema,
  supplierSchema,
} from './schemas.js';
import { createCommerceService } from './service.js';

export function registerCommerceRoutes(app: FastifyInstance, db: Db) {
  const service = createCommerceService(db);

  async function authorize(request: FastifyRequest, permission: Permission) {
    const context = authContext(request);
    const companyId = validId(params(request).companyId);
    await requireCompany(db, context.user.id, companyId, permission);
    return { context, companyId };
  }

  app.get('/api/companies/:companyId/categories', async request => {
    const { context, companyId } = await authorize(request, 'products.read');
    return service.listCategories(context, companyId, listQuerySchema.parse(request.query));
  });
  app.post('/api/companies/:companyId/categories', async (request, reply) => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return reply.code(201).send({ category: await service.createCategory(context, companyId, categorySchema.parse(request.body)) });
  });
  app.patch('/api/companies/:companyId/categories/:categoryId', async request => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return { category: await service.updateCategory(context, companyId, validId(params(request).categoryId), categoryPatchSchema.parse(request.body)) };
  });

  app.get('/api/companies/:companyId/products', async request => {
    const { context, companyId } = await authorize(request, 'products.read');
    return service.listProducts(context, companyId, listQuerySchema.parse(request.query));
  });
  app.post('/api/companies/:companyId/products', async (request, reply) => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return reply.code(201).send({ product: await service.createProduct(context, companyId, productSchema.parse(request.body)) });
  });
  app.patch('/api/companies/:companyId/products/:productId', async request => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return { product: await service.updateProduct(context, companyId, validId(params(request).productId), productPatchSchema.parse(request.body)) };
  });

  app.get('/api/companies/:companyId/suppliers', async request => {
    const { context, companyId } = await authorize(request, 'company.read');
    return service.listSuppliers(context, companyId, listQuerySchema.parse(request.query));
  });
  app.post('/api/companies/:companyId/suppliers', async (request, reply) => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return reply.code(201).send({ supplier: await service.createSupplier(context, companyId, supplierSchema.parse(request.body)) });
  });
  app.patch('/api/companies/:companyId/suppliers/:supplierId', async request => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return { supplier: await service.updateSupplier(context, companyId, validId(params(request).supplierId), supplierPatchSchema.parse(request.body)) };
  });

  app.get('/api/companies/:companyId/customers', async request => {
    const { context, companyId } = await authorize(request, 'company.read');
    return service.listCustomers(context, companyId, listQuerySchema.parse(request.query));
  });
  app.post('/api/companies/:companyId/customers', async (request, reply) => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return reply.code(201).send({ customer: await service.createCustomer(context, companyId, customerSchema.parse(request.body)) });
  });
  app.patch('/api/companies/:companyId/customers/:customerId', async request => {
    const { context, companyId } = await authorize(request, 'products.manage');
    return { customer: await service.updateCustomer(context, companyId, validId(params(request).customerId), customerPatchSchema.parse(request.body)) };
  });
}
