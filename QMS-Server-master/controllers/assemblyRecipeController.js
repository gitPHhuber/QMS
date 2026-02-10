const {
    AssemblyRecipe, RecipeStep, AssemblyProcess,
    WarehouseBox, Project, User, Team, Section, WarehouseMovement
} = require("../models/index");
const { Op } = require("sequelize");
const sequelize = require("../db");
const ApiError = require("../error/ApiError");

class AssemblyRecipeController {


    async createOrUpdate(req, res, next) {
        const t = await sequelize.transaction();
        try {
            const { projectId, title, steps } = req.body;

            if (!projectId) {
                await t.rollback();
                return next(ApiError.badRequest("Не указан ID проекта"));
            }


            let recipe = await AssemblyRecipe.findOne({ where: { projectId }, transaction: t });

            if (recipe) {

                await recipe.update({ title }, { transaction: t });

                await RecipeStep.destroy({ where: { recipeId: recipe.id }, transaction: t });
            } else {

                recipe = await AssemblyRecipe.create({ projectId, title }, { transaction: t });
            }


            if (steps && steps.length > 0) {
                const stepData = steps.map((s, index) => ({
                    recipeId: recipe.id,
                    order: index + 1,
                    title: s.title || "Шаг без названия",
                    quantity: s.quantity || 1,
                    description: s.description || null
                }));
                await RecipeStep.bulkCreate(stepData, { transaction: t });
            }

            await t.commit();
            return res.json(recipe);

        } catch (e) {
            await t.rollback();
            console.error(e);
            next(ApiError.badRequest(e.message));
        }
    }


    async getByProject(req, res, next) {
        try {
            const { projectId } = req.params;
            const recipe = await AssemblyRecipe.findOne({
                where: { projectId },
                include: [{ model: RecipeStep, as: "steps" }],
                order: [[{ model: RecipeStep, as: "steps" }, 'order', 'ASC']]
            });

            return res.json(recipe);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }


    async startAssembly(req, res, next) {
        const t = await sequelize.transaction();
        try {
            const { qrCode, projectId } = req.body;

            if (!qrCode || !projectId) {
                await t.rollback();
                return next(ApiError.badRequest("Не указан QR-код или Проект"));
            }


            const recipe = await AssemblyRecipe.findOne({
                where: { projectId },
                include: [{ model: RecipeStep, as: "steps" }],
                transaction: t
            });

            if (!recipe) {
                await t.rollback();
                return next(ApiError.notFound("Для этого проекта еще не создан рецепт сборки"));
            }


            let box = await WarehouseBox.findOne({ where: { qrCode }, transaction: t });


            if (!box) {
                const project = await Project.findByPk(projectId, { transaction: t });
                const projectTitle = project ? project.title : "Неизвестный проект";

                box = await WarehouseBox.create({
                    qrCode: qrCode,
                    label: projectTitle,
                    originType: "PRODUCT",
                    projectName: projectTitle,
                    quantity: 1,
                    unit: "шт",
                    status: "ASSEMBLY",
                    acceptedById: req.user.id,
                    acceptedAt: new Date()
                }, { transaction: t });

                console.log(`[Assembly] Создано новое изделие: ${qrCode} (User: ${req.user.id})`);
            } else {

                if (box.status !== 'ASSEMBLY' && box.status !== 'DONE') {
                    await box.update({ status: 'ASSEMBLY' }, { transaction: t });
                }
            }


            let process = await AssemblyProcess.findOne({
                where: {
                    boxId: box.id,
                    recipeId: recipe.id,
                    status: "IN_PROGRESS"
                },
                transaction: t
            });


            if (!process) {
                process = await AssemblyProcess.create({
                    boxId: box.id,
                    recipeId: recipe.id,
                    completedSteps: [],
                    status: "IN_PROGRESS",
                    startTime: new Date()
                }, { transaction: t });
            }

            await t.commit();


            return res.json({ process, recipe });

        } catch (e) {
            await t.rollback();
            console.error(e);
            next(ApiError.badRequest(e.message));
        }
    }


    async updateProcessStep(req, res, next) {
        try {
            const { id } = req.params;
            const { stepIndex, isDone } = req.body;

            const process = await AssemblyProcess.findByPk(id);
            if (!process) return next(ApiError.notFound("Процесс не найден"));

            let steps = [...(process.completedSteps || [])];

            if (isDone) {

                if (!steps.includes(stepIndex)) steps.push(stepIndex);
            } else {

                steps = steps.filter(i => i !== stepIndex);
            }


            await process.update({ completedSteps: steps });

            return res.json(process);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }


    async finishAssembly(req, res, next) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;

            const process = await AssemblyProcess.findByPk(id, { transaction: t });
            if (!process) {
                await t.rollback();
                return next(ApiError.notFound("Процесс не найден"));
            }


            await process.update({
                status: "COMPLETED",
                endTime: new Date()
            }, { transaction: t });


            const box = await WarehouseBox.findByPk(process.boxId, { transaction: t });
            await box.update({ status: "ON_STOCK" }, { transaction: t });


            await WarehouseMovement.create({
                boxId: box.id,
                operation: "ASSEMBLY_FINISH",
                deltaQty: 0,
                goodQty: 1,
                scrapQty: 0,
                performedById: req.user.id,
                performedAt: new Date(),
                comment: `Сборка завершена по рецепту #${process.recipeId}`
            }, { transaction: t });

            await t.commit();
            return res.json({ message: "Сборка успешно завершена" });
        } catch (e) {
            await t.rollback();
            next(ApiError.badRequest(e.message));
        }
    }


    async getAssembledList(req, res, next) {
        try {
            const { projectId, search } = req.query;

            const where = { status: "COMPLETED" };

            const processes = await AssemblyProcess.findAll({
                where,
                include: [
                    {
                        model: WarehouseBox,
                        as: "box",
                        where: search ? { qrCode: { [Op.iLike]: `%${search}%` } } : undefined
                    },
                    {
                        model: AssemblyRecipe,
                        as: "recipe",
                        where: projectId ? { projectId } : undefined,
                        include: [
                            { model: Project, as: "project", attributes: ["title"] },
                            { model: RecipeStep, as: "steps", attributes: ["id"] }
                        ]
                    }
                ],
                order: [["endTime", "DESC"]],
                limit: 200
            });


            const result = await Promise.all(processes.map(async (p) => {
                const user = await User.findByPk(p.box.acceptedById, { attributes: ['name', 'surname'] });


                const totalSteps = p.recipe.steps.length;
                const completedCount = p.completedSteps ? p.completedSteps.length : 0;
                const hasDefects = completedCount < totalSteps;

                return {
                    id: p.id,
                    boxId: p.box.id,
                    qrCode: p.box.qrCode,
                    projectTitle: p.recipe.project.title,
                    startTime: p.startTime,
                    endTime: p.endTime,
                    assembler: user ? `${user.surname} ${user.name}` : "Неизвестно",
                    hasDefects,
                    progress: `${completedCount} / ${totalSteps}`
                };
            }));

            return res.json(result);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }


    async getAssemblyPassport(req, res, next) {
        try {
            const { processId } = req.params;

            const process = await AssemblyProcess.findByPk(processId, {
                include: [
                    {
                        model: AssemblyRecipe,
                        as: "recipe",
                        include: [
                            { model: RecipeStep, as: "steps" },
                            { model: Project, as: "project" }
                        ]
                    },
                    { model: WarehouseBox, as: "box" }
                ]
            });

            if (!process) return next(ApiError.notFound("Сборка не найдена"));


            const user = await User.findByPk(process.box.acceptedById, {
                include: [{
                    model: Team,
                    include: [{ model: Section }]
                }]
            });

            let structureInfo = "Вне структуры";
            if (user && user.team) {
                structureInfo = `${user.team.section ? user.team.section.title : "Нет участка"} / ${user.team.title}`;
            }

            return res.json({
                process,
                steps: process.recipe.steps.sort((a, b) => a.order - b.order),
                user: user ? {
                    name: user.name,
                    surname: user.surname,
                    login: user.login,
                    structure: structureInfo
                } : null
            });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }


    async updatePassport(req, res, next) {
        try {
            const { id } = req.params;
            const { completedSteps } = req.body;

            const process = await AssemblyProcess.findByPk(id);
            if (!process) return next(ApiError.notFound("Процесс не найден"));

            await process.update({ completedSteps });

            return res.json({ message: "Паспорт обновлен" });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }
}

module.exports = new AssemblyRecipeController();
