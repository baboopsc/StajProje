"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const comments_service_1 = require("./comments.service");
describe('CommentsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [comments_service_1.CommentsService],
        }).compile();
        service = module.get(comments_service_1.CommentsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=comments.service.spec.js.map