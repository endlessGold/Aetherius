export const handleGetStatus = (session) => async (req, res) => {
    const id = req.params.id || '';
    try {
        const result = await session.enqueueRequest('status', { id });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
