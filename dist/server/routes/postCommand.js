export const handlePostCommand = (session) => async (req, res) => {
    const { cmd } = req.body;
    if (!cmd) {
        res.status(400).json({ success: false, message: 'Missing "cmd" field in body.' });
        return;
    }
    try {
        // Enqueue command and wait for next tick execution
        const result = await session.enqueueRequest('command', { cmdStr: cmd });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
