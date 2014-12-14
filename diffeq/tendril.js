var TC = new Object();
//TC.frequency = 120;
TC.tRange = 1;
TC.steps = 128;
TC.stepsPerStep = 1;
TC.tSpan = 0.1;
TC.life = 1;

TC.deriv = function(v, t)
{
    return vec2.fromValues(TC.dx.eval([v[0], v[1]]), TC.dy.eval([v[0], v[1]]));
}

function Tendril(x, y, globalTime)
{
    this.dead = false;
    this.drawReady = false;
    this.globalTime = globalTime+TC.tRange;
    this.time = -TC.life;
    this.points = [];
    
    var base = vec2.fromValues(x, y);
    var baseI = TC.steps;
    this.points[baseI] = base;
    
    var loc = vec2.clone(base);
    var t = this.globalTime;
    var tStepSize = TC.tRange/TC.steps/TC.stepsPerStep;
    
    for (var i=baseI; i<baseI+TC.steps; i++)
    {
        for (var j=0; j<TC.stepsPerStep; j++)
        {
            t += tStepSize;
            vec2.scaleAndAdd(loc, loc, TC.deriv(loc, t), tStepSize);
        }
        this.points[i+1] = vec2.clone(loc);
    }
    
    loc = vec2.clone(base);
    t = this.globalTime;
    for (var i=baseI; i>baseI-TC.steps; i--)
    {
        for (var j=0; j<TC.stepsPerStep; j++)
        {
            t -= tStepSize;
            vec2.scaleAndAdd(loc, loc, TC.deriv(loc, t), -tStepSize);
        }
        this.points[i-1] = vec2.clone(loc);
    }
}

Tendril.prototype.step = function(dt)
{
    this.time += dt;
    
    if (this.time >= TC.life)
        this.dead = true;
}

Tendril.prototype.initDraw = function(gl)
{
    this.posBuffer = gl.createBuffer();
    this.weightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    var vertices = [];
    for (var i=0; i<this.points.length; i++)
    {
        vertices[i*2] = this.points[i][0];
        vertices[i*2+1] = this.points[i][1];
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.posBuffer.itemSize = 2;
    this.posBuffer.numItems = this.points.length;
}

Tendril.prototype.destroyDraw = function(gl)
{
    if (this.drawReady)
    {
        gl.deleteBuffer(this.posBuffer);
        gl.deleteBuffer(this.weightBuffer);
    }
}

Tendril.prototype.setWeights = function(gl)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, this.weightBuffer);
    var weight = [];
    for (var i=0; i<this.points.length; i++)
    {
        weight[i] = this.getWeight((i-TC.steps)*TC.tRange/TC.steps);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(weight), gl.STATIC_DRAW);
    this.weightBuffer.itemSize = 1;
    this.weightBuffer.numItems = this.points.length;
}

Tendril.prototype.draw = function(gl)
{
    if (!this.drawReady)
    {
        this.drawReady = true;
        this.initDraw(gl);
    }
    
    this.setWeights(gl);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.posBuffer.itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.weightBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexStrengthAttribute, this.weightBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.LINE_STRIP, 0, this.posBuffer.numItems);
}
/*public void draw(Graphics2D g)
{
    for (int i=0; i<points.length-1; i++)
    {
        double weight = getWeight((i-steps)*tRange/steps);
        if (weight != 0)
        {
            int col = (int)((weight)*255);
            g.setColor(new Color(0, 0, 0, col));
            drawLine(g, points[i], points[i+1]);
        }
    }
}*/

Tendril.prototype.getWeight = function(t)
{
    var progress = this.time/TC.life;
    var tCenter = progress*(TC.tRange-TC.tSpan);
    if (t < tCenter-TC.tSpan || t > tCenter+TC.tSpan)
        return 0;
    
    var subProgress = (t-tCenter)/TC.tSpan;
    var sqrtSubWeight = 1-subProgress*subProgress;
    var subWeight = sqrtSubWeight*sqrtSubWeight;
    
    var sqrtWeight = 1-progress*progress;
    return subWeight*sqrtWeight*sqrtWeight;
}