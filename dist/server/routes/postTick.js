export const handlePostTick = (session) => async (req, res) => {
    const count = req.body.count || 1;
    try {
        const result = await session.enqueueRequest('tick', { count });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
