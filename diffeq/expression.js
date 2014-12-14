function Constant(c)
{
	this.c = c;
}

Constant.prototype.eval = function(x)
{
	return this.c;
};

Constant.prototype.derivative = function(x, type)
{
	return 0;
};


function Variable(type)
{
	this.type = type;
}

Variable.prototype.eval = function(x)
{
	if (x.length > this.type)
		return x[this.type];
	return NaN;
};

Variable.prototype.derivative = function(x, type)
{
	if (this.type == type)
		return 1;
	else
		return 0;
};


function Sum(e1, e2)
{
	this.e1 = e1;
	this.e2 = e2;
}

Sum.prototype.eval = function(x)
{
	return this.e1.eval(x) + this.e2.eval(x);
};

Sum.prototype.derivative = function(x, type)
{
	return this.e1.derivative(x, type) + this.e2.derivative(x, type);
};


function Difference(e1, e2)
{
	this.e1 = e1;
	this.e2 = e2;
}

Difference.prototype.eval = function(x)
{
	return this.e1.eval(x) - this.e2.eval(x);
};

Difference.prototype.derivative = function(x, type)
{
	return this.e1.derivative(x, type) - this.e2.derivative(x, type);
};


function Negation(e)
{
	this.e = e;
}

Negation.prototype.eval = function(x)
{
	return -this.e.eval(x);
};

Negation.prototype.derivative = function(x, type)
{
	return -this.e.derivative(x, type);
};


function Product(e1, e2)
{
	this.e1 = e1;
	this.e2 = e2;
}

Product.prototype.eval = function(x)
{
	return this.e1.eval(x) * this.e2.eval(x);
};

Product.prototype.derivative = function(x, type)
{
	return this.e1.eval(x) * this.e2.derivative(x, type) + this.e2.eval(x) * this.e1.derivative(x, type);
};


function Quotient(e1, e2)
{
	this.e1 = e1;
	this.e2 = e2;
}

Quotient.prototype.eval = function(x)
{
	return this.e1.eval(x) / this.e2.eval(x);
};

Quotient.prototype.derivative = function(x, type)
{
	var v2 = this.e2.eval(x);
	return (v2 * this.e1.derivative(x, type) + this.e1.eval(x) * this.e2.derivative(x, type)) / (v2*v2);
};


function Power(e1, e2)
{
	this.e1 = e1;
	this.e2 = e2;
}

Power.prototype.eval = function(x)
{
	return Math.pow(this.e1.eval(x), this.e2.eval(x));
};

Power.prototype.derivative = function(x, type)
{
	var d1 = this.e1.derivative(x, type), d2 = this.e2.derivative(x, type);
	var v1 = this.e1.eval(x), v2 = this.e2.eval(x);
	
	if (d1 == 0 && d2 == 0)
		return 0;
	else if (d1 == 0) //Exponential function
		return Math.pow(v1, v2) * d2 * Math.log(v1);
	else if (d2 == 0) //Power function
		return Math.pow(v1, v2-1) * d1 * v2;
	else //Both the base and exponent are changing
		return Math.pow(v1, v2-1) * (d1*v2 + d2*v1*Math.log(v1));
};


function Function(args, functionType)
{
	this.args = args;
	this.argValues = Array(this.args.length);
	this.derValues = Array(this.args.length);
	this.functionType = functionType;
}

Function.prototype.eval = function(x)
{
	for (var i=0; i<this.args.length; i++)
	{
		this.argValues[i] = this.args[i].eval(x);
	}
	return FL.eval(this.argValues, this.functionType);
};

Function.prototype.derivative = function(x, type)
{
	for (var i=0; i<this.args.length; i++)
	{
		this.argValues[i] = this.args[i].eval(x);
		this.derValues[i] = this.args[i].derivative(x, type);
	}
	return FL.derivative(this.argValues, this.derValues, this.functionType);
};


var FL = new Object();
FL.names = ["abs", "arccos", "arccot", "arccsc", "arcsec", "arcsin", "arctan", "ceil", "cos", "cot", "csc",
		"floor", "max", "min", "mod", "round", "sec", "sin", "sqr", "sqrt", "tan", "exp", "ln", "pi", "e"];
FL.numArgs = [1,1,1,1,1,1,1,1,1,1,1,
		1,-1,-1,2,1,1,1,1,1,1,1,1,0,0];

FL.eval = function(x, i)
{
	if (x.length == FL.numArgs[i] || FL.numArgs[i] == -1)
	{
		switch (i)
		{
		case  0: return Math.abs(x[0]); //abs
		case  1: return Math.acos(x[0]); //arccos
		case  2: return Math.atan(1/x[0]); //arccot
		case  3: return Math.asin(1/x[0]); //arccsc
		case  4: return Math.acos(1/x[0]); //arcsec
		case  5: return Math.asin(x[0]); //arcsin
		case  6: return Math.atan(x[0]); //arctan
		case  7: return Math.ceil(x[0]); //ceil
		case  8: return Math.cos(x[0]); //cos
		case  9: return 1/Math.tan(x[0]); //cot
		case 10: return 1/Math.sin(x[0]); //csc
		case 11: return Math.floor(x[0]); //floor
		case 12: return FL.max(x); //max
		case 13: return FL.min(x); //min
		case 14: return x[0]-Math.floor(x[0]/x[1])*x[1]; //mod
		case 15: return Math.round(x[0]); //round
		case 16: return 1/Math.cos(x[0]); //sec
		case 17: return Math.sin(x[0]); //sin
		case 18: return x[0]*x[0]; //sqr
		case 19: return Math.sqrt(x[0]); //sqrt
		case 20: return Math.tan(x[0]); //tan
		case 21: return Math.exp(x[0]); //exp
		case 22: return Math.log(x[0]); //ln
		case 23: return Math.PI; //pi
		case 24: return Math.E; //e
		default: return NaN;
		}
	}
	else
		return NaN;
};

FL.derivative = function(x, d, i)
{
	if (x.length == FL.numArgs[i] || FL.numArgs[i] == -1)
	{
		switch (i)
		{
		case  0: return x[0]>=0?d[0]:-d[0]; //abs
		case  1: return -d[0]/Math.sqrt(1-x[0]*x[0]); //arccos
		case  2: return -d[0]/(1+x[0]*x[0]); //arccot
		case  3: return -d[0]/(x[0]*Math.sqrt(x[0]*x[0]-1)); //arccsc
		case  4: return d[0]/(x[0]*Math.sqrt(x[0]*x[0]-1)); //arcsec
		case  5: return d[0]/Math.sqrt(1-x[0]*x[0]); //arcsin
		case  6: return d[0]/(1+x[0]*x[0]); //arctan
		case  7: return 0; //ceil
		case  8: return -d[0]*Math.sin(x[0]); //cos
		case  9: return -d[0]/sqr(Math.sin(x[0])); //cot
		case 10: return -d[0]/(Math.sin(x[0])*Math.tan(x[0])); //csc
		case 11: return 0; //floor
		case 12: return maxd(x, d); //max
		case 13: return mind(x, d); //min
		case 14: return d[0]; //mod
		case 15: return 0; //round
		case 16: return d[0]*Math.tan(x[0])/Math.cos(x[0]); //sec
		case 17: return d[0]*Math.cos(x[0]); //sin
		case 18: return 2*d[0]*x[0]; //sqr
		case 19: return d[0]/(2*Math.sqrt(x[0])); //sqrt
		case 20: return d[0]/FL.sqr(Math.cos(x[0])); //tan
		case 21: return d[0]*Math.exp(x[0]); //exp
		case 22: return d[0]/x[0]; //ln
		case 23: return 0; //pi
		case 24: return 0; //e
		default: return NaN;
		}
	}
	else
		return NaN;
};

FL.getFunctionNumber = function(s) //Returns -1 if invalid
{
	for (var i=0; i<FL.names.length; i++)
		if (FL.names[i] == s.toLowerCase()) return i;
	return -1;
};

FL.isNumArgumentsValid = function(functionIndex, numArguments)
{
	return ((FL.numArgs[functionIndex] == -1 && numArguments != 0) || FL.numArgs[functionIndex] == numArguments);
};

FL.max = function(x)
{
	if (x.length == 0) return NaN;
	var answer = x[0];
	for (var j=1; j<x.length; j++)
	{
		answer = Math.max(answer, x[j]);
	}
	return answer;
};

FL.min = function(x)
{
	if (x.length == 0) return NaN;
	var answer = x[0];
	for (var j=1; j<x.length; j++)
	{
		answer = Math.min(answer, x[j]);
	}
	return answer;
};

//max derivative function
FL.maxd = function(x, d)
{
	if (x.length == 0) return NaN;
	var value = x[0];
	var loc = 0;
	for (var j=1; j<x.length; j++)
	{
		if (x[j] > value)
		{
			value = x[j];
			loc = j;
		}
	}
	return d[loc];
};

//min derivative function
FL.mind = function(x, d)
{
	if (x.length == 0) return NaN;
	var value = x[0];
	var loc = 0;
	for (var j=1; j<x.length; j++)
	{
		if (x[j] < value)
		{
			value = x[j];
			loc = j;
		}
	}
	return d[loc];
};

FL.sqr = function(x)
{
	return x*x;
};


function parseExpression(s, variableNames)
{
	//Add looseness to the expressions that can be entered and prepare the expression for analysis.
	s = s.toLowerCase();
	s = removeSpaces(s);
	s = removeOuterParentheses(s);
	s = addImpliedMultiplication(s, variableNames);
	
	if (s.length == 0) throw "parse error"; //expression expected when there is none
	
	//Check to see if the expression is a set of to expressions operated together.
	var level; //Level in parentheses
	for (var k=0; k<3; k++) //Loop through the reverse order of operations
	{
		level = 0;
		
		//-3 treats the minus sign differently than 4-3
		if (k>0 && s.charAt(0) == '-')
			return new Negation(parseExpression(s.substring(1), variableNames));
		for (var i=s.length-1; i>=0; i--)
		{
			var c = s.charAt(i);
			//Valid operations must be on the outer level of parentheses and must not be mistaken with exponential notation (3e-1, - is not an operation).
			if (isOperation(c,k) && i>0 && !isOperation(s.charAt(i-1)) && (s.charAt(i-1) != 'e' || i==1 || !isDigit(s.charAt(i-2)))
					&& level==0)
				return separateExpression(s,i,c, variableNames); //Pick correct class to return
			else if (c == ')') level++;
			else if (c == '(') level--;
		}
	}
	
	//Check to see if the expression is a predefined function
	var first = firstWord(s);
	var functionNum = FL.getFunctionNumber(first);
	
	if (functionNum != -1)
	{
		if (s.length == 0 || first.length > s.length) throw "parse error";
		var argsList = Array();
		
		if (first != s)
		{
			if (s.charAt(s.length-1) != ')') throw "parse error";
			if (s.charAt(first.length) != '(') throw "parse error";
			
			var argsString = s.substring(first.length+1, s.length-1);
			if (argsString == "") return new Function(new Expression[0], functionNum);
			
			//Separate arguments
			level = 0;
			for (var i=0; i<argsString.length; i++)
			{
				var c = argsString.charAt(i);
				if (c == ',' && level == 0)
				{
					argsList.push(parseExpression(argsString.substring(0,i), variableNames));
					argsString = argsString.substring(i+1);
					i = 0;
				}
				else if (c == '(') level++;
				else if (c == ')') level--;
			}
			argsList.push(parseExpression(argsString, variableNames));
		}
		
		if (!FL.isNumArgumentsValid(functionNum, argsList.length)) throw "parse error";
		
		return new Function(argsList,functionNum);
	}
	
	//Check to see if the expression is a variable
	for (var i=0; i<variableNames.length; i++)
	{
		if (s.charAt(0) == (variableNames[i]) && s.length == 1) return new Variable(i);
	}
	
	//Check to see if the expression is a constant
	var num = parseFloat(s);
	if (!isFinite(num)) throw "parse error";
	
	return new Constant(num);
}

function removeSpaces(str)
{
	var s = str;
	for (var i=0; i<s.length; i++)
	{
		if (s.charAt(i) == ' ')
			s = s.substring(0,i) + s.substring(i+1);
	}
	return s;
}

function removeOuterParentheses(str)
{
	var s = str;
	while (s.length != 0 && s.charAt(0) == '(' && s.charAt(s.length-1) == ')')
	{
		var level = 1;
		for (var i=s.length-2; i>=1; i--)
		{
			var c = s.charAt(i);
			if (c == ')') level++;
			else if (c == '(') level--;
			
			if (level == 0) break;
		}
		if (level == 0)
			break;
		else
			s = s.substring(1, s.length-1);
	}
	return s;
}

function findFunctions(str)
{
	var s = str;
	for (var i=0; i<str.length; i++)
	{
		var first = firstWord(s.substring(i));
		if (FL.getFunctionNumber(first) != -1)
		{
			var replace = "";
			for (var j=0; j<first.length; j++)
			{
				replace += "_";
			}
			s = s.substring(0,i)+replace+s.substring(i+replace.length);
		}
	}
	return s;
}

function addImpliedMultiplication(str, variableNames)
{
	var s = str;
	var t = findFunctions(str);
	
	for (var i=0; i<s.length-1; i++)
	{
		var c = t.charAt(i);
		var nextC = t.charAt(i+1);
		if (isNumPart(c, variableNames) && (nextC == '(' || isVariable(nextC, variableNames)) ||
				isNumPart(nextC, variableNames) && (c == ')' || c == 'x') || c == ')' && nextC == '(')
		{
			s = s.substring(0,i+1) + '*' + s.substring(i+1);
			t = t.substring(0,i+1) + '*' + t.substring(i+1);
		}
	}
	return s;
}

function firstWord(str)
{
	if (str.length == 0 || isDigit(str.charAt(0)))
		return "";
	for (var i=0; i<str.length; i++)
	{
		var c = str.charAt(i);
		if (!(isLetter(c) || c=='_' || isDigit(c)))
		{
			return str.substring(0,i);
		}
	}
	return str;
}

function isNumPart(c, variableNames)
{
	return isDigit(c) || c == '.' || isVariable(c, variableNames);
}

function isDigit(c)
{
	return c>='0' && c<='9';
}

function isLetter(c)
{
	return c>='A' && c<='Z' || c>='a' && c<='z';
}

function isVariable(c, variableNames)
{
	for (var i=0; i<variableNames.length; i++)
		if (c == variableNames[i]) return true;
	
	return false;
}

function isOperation(c)
{
	return c=='+' || c=='-' || c=='*' || c=='/' || c=='^';
}

function isOperation(c, level)
{
	switch (level)
	{
	case 0:
		return c=='+' || c=='-'; //Break statements unneeded due to return statements
	case 1:
		return c=='*' || c=='/';
	case 2:
		return c=='^';
	default:
		return false;
	}
}

function separateExpression(s, pos, operation, variableNames)
{
	switch (operation)
	{
	case '+':
		return new Sum(parseExpression(s.substring(0,pos), variableNames), parseExpression(s.substring(pos+1), variableNames));
	case '-':
		return new Difference(parseExpression(s.substring(0,pos), variableNames), parseExpression(s.substring(pos+1), variableNames));
	case '*':
		return new Product(parseExpression(s.substring(0,pos), variableNames), parseExpression(s.substring(pos+1), variableNames));
	case '/':
		return new Quotient(parseExpression(s.substring(0,pos), variableNames), parseExpression(s.substring(pos+1), variableNames));
	case '^':
		return new Power(parseExpression(s.substring(0,pos), variableNames), parseExpression(s.substring(pos+1), variableNames));
	default:
		throw "parse error";
	}
}
